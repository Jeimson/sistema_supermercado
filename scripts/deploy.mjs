import { cpSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'

const entornos = {
  staging:    { destino: 'C:/xampp/htdocs/sistema_supermercado-test', env: 'C:/xampp/config/sistema_supermercado-test.env' },
  production: { destino: 'C:/xampp/htdocs/sistema_supermercado',      env: 'C:/xampp/config/sistema_supermercado.env' },
}

const cfg = entornos[process.argv[2]]
if (!cfg) {
  console.error('Uso: node scripts/deploy.mjs <staging|production>')
  process.exit(1)
}
const { destino, env } = cfg

if (!existsSync(env)) {
  console.error(`Falta el archivo de entorno del backend: ${env}`)
  process.exit(1)
}

if (existsSync(destino)) rmSync(destino, { recursive: true, force: true })
mkdirSync(destino, { recursive: true })

// Frontend compilado
cpSync('dist', destino, { recursive: true })

// Backend (sin migraciones ni secretos)
cpSync('backend', `${destino}/api`, {
  recursive: true,
  filter: (src) => {
    const s = src.replaceAll('\\', '/')
    return !s.includes('backend/database') && !s.endsWith('/.env') && !s.endsWith('.env.example')
  },
})

// Indica al backend dónde están sus credenciales (fuera de htdocs)
writeFileSync(`${destino}/api/env-file.php`, `<?php\nreturn '${env}';\n`)

console.log(`✔ Desplegado en ${destino}`)