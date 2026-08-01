#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const scope = 'https://www.googleapis.com/auth/cloud-platform'

function values(name) {
  const result = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === `--${name}` && process.argv[index + 1]) result.push(process.argv[index + 1])
    if (process.argv[index].startsWith(`--${name}=`)) result.push(process.argv[index].slice(name.length + 3))
  }
  return result
}

function value(name, fallback = '') {
  return values(name)[0] || fallback
}

function capture(command, args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr || stdout)))
    child.stdin.end(input)
  })
}

async function configuredProject() {
  try {
    const config = await fs.readFile(path.join(os.homedir(), '.config/gcloud/configurations/config_default'), 'utf8')
    return config.match(/^\s*project\s*=\s*(.+?)\s*$/m)?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

async function accessToken() {
  try {
    return (await capture('gcloud', ['auth', 'application-default', 'print-access-token'])).trim()
  } catch {
    const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(os.homedir(), '.config/gcloud/application_default_credentials.json')
    const credentials = JSON.parse(await fs.readFile(adcPath, 'utf8'))
    if (credentials.type !== 'authorized_user') throw new Error('Unsupported ADC. Run gcloud auth application-default login.')
    const script = [
      'import json, sys, urllib.parse, urllib.request',
      'c=json.loads(sys.stdin.read())',
      `body=urllib.parse.urlencode({'client_id':c['client_id'],'client_secret':c['client_secret'],'refresh_token':c['refresh_token'],'grant_type':'refresh_token'}).encode()`,
      `req=urllib.request.Request('https://oauth2.googleapis.com/token',data=body,headers={'Content-Type':'application/x-www-form-urlencoded'})`,
      `print(json.loads(urllib.request.urlopen(req,timeout=30).read().decode())['access_token'])`,
    ].join('\n')
    return (await capture('python3', ['-c', script], JSON.stringify(credentials))).trim()
  }
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.heic' || extension === '.heif') return 'image/heic'
  return 'image/jpeg'
}

async function main() {
  const imagePaths = values('image')
  if (imagePaths.length === 0) throw new Error('Pass one or more menu images with --image /path/to/image.jpg')
  if (imagePaths.length > 10) throw new Error('At most 10 images are supported per extraction.')

  const project = value('project') || process.env.GOOGLE_CLOUD_PROJECT || await configuredProject()
  const location = value('location', 'us-central1')
  const model = value('model', 'gemini-2.5-flash')
  const sourceUrl = value('source-url')
  if (!project) throw new Error('No Google Cloud project configured.')

  const imageParts = await Promise.all(imagePaths.map(async (filePath) => ({
    inlineData: { mimeType: mimeType(filePath), data: await fs.readFile(filePath, 'base64') },
  })))
  const prompt = `Extract only menu items visibly supported by these images. Do not invent dishes, descriptions, categories, prices, or currencies. Keep a caption such as "Pork Belly 1550" as the dish name unless the image clearly marks 1550 as a price. Use an empty description and null price when absent. Confidence is 0 to 1. evidencePhoto is the 1-based image number. Return JSON only.`
  const schema = {
    type: 'OBJECT',
    required: ['currency', 'items', 'warnings'],
    properties: {
      currency: { type: 'STRING', nullable: true },
      warnings: { type: 'ARRAY', items: { type: 'STRING' } },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['category', 'name', 'description', 'price', 'confidence', 'evidencePhoto'],
          properties: {
            category: { type: 'STRING' }, name: { type: 'STRING' }, description: { type: 'STRING' },
            price: { type: 'NUMBER', nullable: true }, confidence: { type: 'NUMBER' },
            evidencePhoto: { type: 'INTEGER' },
          },
        },
      },
    },
  }

  const token = await accessToken()
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`
  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
    generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema: schema },
  })
  const raw = await capture('curl', [
    '--fail-with-body', '--silent', '--show-error', '--request', 'POST', endpoint,
    '--header', `Authorization: Bearer ${token}`, '--header', 'Content-Type: application/json',
    '--data-binary', '@-',
  ], requestBody)
  const responseData = JSON.parse(raw)
  const modelText = responseData.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  if (!modelText) throw new Error('Vertex Gemini returned no structured output.')
  const extracted = JSON.parse(modelText)
  const output = JSON.stringify({
    sourceUrl: sourceUrl || null,
    imagesAnalyzed: imagePaths.length,
    model,
    ...extracted,
  }, null, 2)
  const outputPath = value('out')
  if (outputPath) {
    await fs.writeFile(outputPath, `${output}\n`)
    process.stderr.write(`Wrote ${outputPath}\n`)
  } else {
    process.stdout.write(`${output}\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
