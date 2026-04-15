const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, BorderStyle, TableOfContents } = require('docx');

const SRC = '/home/z/my-project/src';
const SCHEMA = '/home/z/my-project/prisma/schema.prisma';

function getAllFiles(dir, exts) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!['node_modules', '.next', '.prisma', 'ui'].includes(entry.name)) {
                results = results.concat(getAllFiles(full, exts));
            }
        } else if (exts.some(e => entry.name.endsWith(e))) {
            results.push(full);
        }
    }
    return results;
}

function categorize(f) {
    const r = f.replace('/home/z/my-project/', '');
    if (r.includes('/components/ui/')) return 'UI Components (shadcn)';
    if (r.includes('/components/')) return 'Componentes';
    if (r.includes('/app/api/')) return 'API Routes';
    if (r.includes('/lib/')) return 'Librerias';
    if (r.includes('/hooks/')) return 'Hooks';
    if (r.includes('/contexts/')) return 'Contexts';
    if (r.includes('/i18n/')) return 'Internacionalizacion';
    if (r.endsWith('middleware.ts')) return 'Middleware';
    if (r.endsWith('page.tsx')) return 'Paginas';
    if (r.endsWith('layout.tsx')) return 'Layouts';
    if (r.endsWith('RouteMap.tsx') || r.endsWith('LocationMap.tsx') || r.endsWith('TrackingMap.tsx') || r.endsWith('TaxiTrackingMap.tsx') || r.endsWith('LiveMap.tsx')) return 'Mapas';
    return 'Otros';
}

function analyzeFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const rel = filepath.replace('/home/z/my-project/', '');
    const lines = content.split('\n').length;
    
    const imports = [];
    const exports = [];
    const functions = [];
    const hooks = [];
    const apiMethods = [];
    
    for (const line of content.split('\n')) {
        const t = line.trim();
        if (t.startsWith('import ')) imports.push(t.substring(0, 150));
        if (t.includes('export ') && !t.startsWith('//')) exports.push(t.substring(0, 150));
        if (t.startsWith('function ') || t.startsWith('async function ') || t.startsWith('export function ') || t.startsWith('export async function ')) {
            functions.push(t.substring(0, 150));
        }
        if (t.startsWith('const ') && t.includes('=>') && t.includes('(') && !t.startsWith('//')) {
            functions.push(t.substring(0, 150));
        }
        if (t.includes('useState') || t.includes('useEffect') || t.includes('useCallback') || t.includes('useMemo') || t.includes('useRef')) {
            hooks.push(t.substring(0, 150));
        }
        if (t.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/)) {
            apiMethods.push(t.substring(0, 150));
        }
    }
    
    return { path: rel, lines, content, imports: imports.slice(0, 8), exports: exports.slice(0, 10), functions: functions.slice(0, 15), hooks: hooks.slice(0, 10), apiMethods };
}

// Collect all files
let allFiles = [];

// Schema
const schemaContent = fs.readFileSync(SCHEMA, 'utf-8');
allFiles.push({ path: 'schema.prisma', lines: schemaContent.split('\n').length, content: schemaContent, category: 'Schema', imports: [], exports: [], functions: [], hooks: [], apiMethods: [] });

// Source files
const files = getAllFiles(SRC, ['.tsx', '.ts']);
for (const f of files) {
    const info = analyzeFile(f);
    info.category = categorize(f);
    allFiles.push(info);
}

// Sort
allFiles.sort((a, b) => {
    const catOrder = ['Schema', 'Librerias', 'Hooks', 'Contexts', 'Middleware', 'Internacionalizacion', 'Paginas', 'Layouts', 'Componentes', 'Mapas', 'API Routes', 'UI Components (shadcn)', 'Otros'];
    const ai = catOrder.indexOf(a.category);
    const bi = catOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return a.path.localeCompare(b.path);
});

// Build document sections
const children = [];

// Cover page
children.push(
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
        children: [new TextRun({ text: 'EITAXI', font: 'Arial', size: 72, bold: true, color: 'FACC15' })],
        alignment: 'center'
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Prompts Completos Para Replicar', font: 'Arial', size: 44, bold: true, color: 'FFFFFF' })],
        alignment: 'center',
        spacing: { before: 200 }
    }),
    new Paragraph({
        children: [new TextRun({ text: 'El Proyecto Desde Cero', font: 'Arial', size: 36, color: 'A0A0A0' })],
        alignment: 'center',
        spacing: { before: 100 }
    }),
    new Paragraph({ spacing: { before: 1000 } }),
    new Paragraph({
        children: [new TextRun({ text: `Archivos: ${allFiles.length} | Lineas de codigo: ${allFiles.reduce((s, f) => s + f.lines, 0).toLocaleString()} | Prompts: ${allFiles.length}`, font: 'Arial', size: 22, color: 'A0A0A0' })],
        alignment: 'center'
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Framework: Next.js 15 + TypeScript + Tailwind CSS + Prisma + PostgreSQL', font: 'Arial', size: 22, color: 'A0A0A0' })],
        alignment: 'center',
        spacing: { before: 100 }
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Generado: 16 de Abril 2026', font: 'Arial', size: 22, color: 'A0A0A0' })],
        alignment: 'center',
        spacing: { before: 100 }
    }),
    new Paragraph({ children: [new PageBreak()] })
);

// Index
children.push(
    new Paragraph({ text: 'INDICE DE CONTENIDOS', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ spacing: { after: 200 } })
);

let currentCat = '';
let promptNum = 0;
for (const f of allFiles) {
    if (f.category !== currentCat) {
        currentCat = f.category;
        children.push(new Paragraph({ text: currentCat, heading: HeadingLevel.HEADING_2, spacing: { before: 300 } }));
    }
    promptNum++;
    children.push(new Paragraph({
        children: [
            new TextRun({ text: `PROMPT ${promptNum}: `, bold: true, size: 20, color: 'FACC15' }),
            new TextRun({ text: `${f.path} `, size: 20 }),
            new TextRun({ text: `(${f.lines} lineas)`, size: 18, color: '808080', italics: true }),
        ]
    }));
}
children.push(new Paragraph({ children: [new PageBreak()] }));

// Detailed prompts
promptNum = 0;
for (const f of allFiles) {
    promptNum++;
    
    children.push(
        new Paragraph({ text: `PROMPT ${promptNum}: ${f.path}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Tipo: ', bold: true, size: 22 }),
                new TextRun({ text: f.category, size: 22 }),
                new TextRun({ text: `  |  Lineas: `, bold: true, size: 22 }),
                new TextRun({ text: `${f.lines}`, size: 22 }),
            ],
            spacing: { before: 100 }
        })
    );
    
    if (f.imports && f.imports.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Imports:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 200 } }));
        for (const imp of f.imports.slice(0, 8)) {
            children.push(new Paragraph({ children: [new TextRun({ text: `  ${imp}`, size: 18, font: 'Consolas' })] }));
        }
    }
    
    if (f.exports && f.exports.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Exports:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 200 } }));
        for (const exp of f.exports.slice(0, 10)) {
            children.push(new Paragraph({ children: [new TextRun({ text: `  ${exp}`, size: 18, font: 'Consolas' })] }));
        }
    }
    
    if (f.functions && f.functions.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Funciones:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 200 } }));
        for (const fn of f.functions.slice(0, 15)) {
            children.push(new Paragraph({ children: [new TextRun({ text: `  ${fn}`, size: 18, font: 'Consolas' })] }));
        }
    }
    
    if (f.hooks && f.hooks.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Hooks React:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 200 } }));
        for (const h of f.hooks.slice(0, 10)) {
            children.push(new Paragraph({ children: [new TextRun({ text: `  ${h}`, size: 18, font: 'Consolas' })] }));
        }
    }
    
    if (f.apiMethods && f.apiMethods.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Metodos HTTP:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 200 } }));
        for (const m of f.apiMethods) {
            children.push(new Paragraph({ children: [new TextRun({ text: `  ${m}`, size: 18, font: 'Consolas' })] }));
        }
    }
    
    // Content section
    children.push(new Paragraph({ children: [new TextRun({ text: 'Contenido:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 300 } }));
    
    if (f.lines <= 80) {
        // Include full content for small files
        const codeLines = f.content.split('\n');
        for (const cl of codeLines) {
            children.push(new Paragraph({ children: [new TextRun({ text: cl || ' ', size: 16, font: 'Consolas' })] }));
        }
    } else {
        // Summary for large files
        const codeLines = f.content.split('\n').filter(l => l.trim().length > 5 && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
        const preview = codeLines.slice(0, 60);
        for (const cl of preview) {
            const truncated = cl.length > 120 ? cl.substring(0, 120) + '...' : cl;
            children.push(new Paragraph({ children: [new TextRun({ text: truncated, size: 16, font: 'Consolas' })] }));
        }
        if (codeLines.length > 60) {
            children.push(new Paragraph({ children: [new TextRun({ text: `... (${codeLines.length - 60} lineas mas - ver archivo fuente)`, size: 16, italics: true, color: '808080' })] }));
        }
    }
    
    // Prompt to recreate
    children.push(new Paragraph({ children: [new TextRun({ text: 'Prompt para recrear:', bold: true, size: 22, color: 'FACC15' })], spacing: { before: 300 } }));
    children.push(new Paragraph({
        children: [new TextRun({ text: `Crea el archivo ${f.path} con ${f.lines} lineas. Tipo: ${f.category}. ${f.apiMethods && f.apiMethods.length > 0 ? 'API Route con metodos: ' + f.apiMethods.join(', ') + '.' : ''} Ver detalles de imports, exports y funciones arriba.`, size: 20 })],
        spacing: { after: 400 }
    }));
}

// Create document
const doc = new Document({
    sections: [{
        properties: {
            page: {
                margin: { top: 720, right: 720, bottom: 720, left: 720 },
                size: { width: 12240, height: 15840 }
            }
        },
        children
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/home/z/my-project/download/Eitaxi-Completo-Prompts-Para-Replicar.docx', buffer);
    const sizeKB = Math.round(buffer.length / 1024);
    console.log(`Documento generado: Eitaxi-Completo-Prompts-Para-Replicar.docx (${sizeKB} KB)`);
    console.log(`Archivos cubiertos: ${allFiles.length}`);
    console.log(`Total lineas de codigo: ${allFiles.reduce((s, f) => s + f.lines, 0).toLocaleString()}`);
});
