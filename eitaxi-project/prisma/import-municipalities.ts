import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as url from 'url'
import * as path from 'path'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

// Slug function
function createSlug(name: string, canton: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâäæãåā]/g, 'a')
    .replace(/[èéêëēėę]/g, 'e')
    .replace(/[îïíīįì]/g, 'i')
    .replace(/[ôöòóœøōõ]/g, 'o')
    .replace(/[ûüùúū]/g, 'u')
    .replace(/[çćč]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + canton.toLowerCase()
}

interface Municipality {
  name: string
  postalCode: string
  canton: string
}

async function main() {
  console.log('🌱 Importando municipios de Suiza y Liechtenstein...')
  console.log('⚠️ NO se borrará ningún dato existente')
  
  // Read the JSON file
  const dataPath = path.join(__dirname, 'complete-swiss-municipalities.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  
  console.log(`📊 Total municipios en archivo: ${data.municipalities.length}`)
  
  // Get existing locations count
  const existingCount = await prisma.location.count()
  console.log(`📊 Municipios existentes en BD: ${existingCount}`)
  
  // Load canton map
  const cantons = await prisma.canton.findMany()
  const cantonMap = new Map(cantons.map(c => [c.code, c.id]))
  console.log(`📊 Cantones cargados: ${cantons.length}`)
  
  let added = 0
  let skipped = 0
  let errors = 0
  
  for (const muni of data.municipalities as Municipality[]) {
    try {
      const cantonId = cantonMap.get(muni.canton)
      
      // Check if already exists by name and postal code
      const existing = await prisma.location.findFirst({
        where: {
          name: muni.name,
          postalCode: muni.postalCode,
          type: 'city'
        }
      })
      
      if (existing) {
        // Update postal code if missing
        if (!existing.postalCode) {
          await prisma.location.update({
            where: { id: existing.id },
            data: { postalCode: muni.postalCode }
          })
          console.log(`  ✓ Actualizado código postal para: ${muni.name} (${muni.postalCode})`)
        }
        skipped++
        continue
      }
      
      // Create new location
      await prisma.location.create({
        data: {
          name: muni.name,
          type: 'city',
          postalCode: muni.postalCode,
          cantonId: cantonId || null
        }
      })
      
      added++
      if (added % 100 === 0) {
        console.log(`  ✓ Progreso: ${added} añadidos...`)
      }
      
    } catch (error: any) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`  ✗ Error con ${muni.name}: ${error.message}`)
        errors++
      }
    }
  }
  
  // Final count
  const finalCount = await prisma.location.count()
  const withPostalCode = await prisma.location.count({
    where: { postalCode: { not: null } }
  })
  const withoutPostalCode = await prisma.location.count({
    where: { OR: [{ postalCode: null }, { postalCode: '' }] }
  })
  
  console.log('\n✅ Importación completada!')
  console.log(`   📥 Añadidos: ${added}`)
  console.log(`   ⏭️ Saltados (ya existían): ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📊 Total en BD: ${finalCount}`)
  console.log(`   ✉️ Con código postal: ${withPostalCode}`)
  console.log(`   ⚠️ Sin código postal: ${withoutPostalCode}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
