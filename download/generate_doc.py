import os
import subprocess
import json

SRC = "/home/z/my-project/src"
SCHEMA = "/home/z/my-project/schema.prisma"
OUTPUT = "/home/z/my-project/download/Eitaxi-Completo-Prompts-Para-Replicar.txt"

def get_file_info(filepath):
    """Get basic info about a file"""
    rel = os.path.relpath(filepath, "/home/z/my-project")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        lines = content.count('\n') + 1
        size = len(content)
        return {
            'path': rel,
            'lines': lines,
            'size': size,
            'content': content
        }
    except:
        return None

def get_imports(content):
    """Extract import statements"""
    imports = []
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('import ') or line.startswith("require('"):
            imports.append(line)
    return imports[:10]  # first 10

def get_exports(content):
    """Extract exported functions, components, constants"""
    exports = []
    for line in content.split('\n'):
        line = line.strip()
        if 'export ' in line or 'export default' in line:
            exports.append(line[:120])
    return exports[:15]  # first 15

def get_functions(content):
    """Extract function declarations"""
    funcs = []
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('function ') or line.startswith('const ') and '=>' in line and '(' in line:
            funcs.append(line[:120])
        elif line.startswith('async function ') or line.startswith('export async function'):
            funcs.append(line[:120])
    return funcs[:20]

def get_hooks(content):
    """Extract React hooks"""
    hooks = []
    for line in content.split('\n'):
        line = line.strip()
        if any(h in line for h in ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef']):
            hooks.append(line[:120])
    return hooks[:15]

def categorize_file(rel_path):
    if 'api/' in rel_path:
        return 'API Route'
    if '/components/ui/' in rel_path:
        return 'UI Component (shadcn)'
    if '/components/' in rel_path:
        return 'Component'
    if '/lib/' in rel_path:
        return 'Library'
    if '/hooks/' in rel_path:
        return 'Hook'
    if '/contexts/' in rel_path:
        return 'Context'
    if '/i18n/' in rel_path:
        return 'i18n'
    if rel_path == 'middleware.ts':
        return 'Middleware'
    if '/app/' in rel_path and rel_path.endswith('page.tsx'):
        return 'Page'
    if '/app/' in rel_path and rel_path.endswith('layout.tsx'):
        return 'Layout'
    if rel_path == 'schema.prisma':
        return 'Schema'
    return 'Other'

# Collect all files
all_files = []

# schema.prisma
info = get_file_info(SCHEMA)
if info:
    info['category'] = 'Schema'
    all_files.append(info)

# All src files
for root, dirs, files in os.walk(SRC):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            fp = os.path.join(root, f)
            info = get_file_info(fp)
            if info:
                info['category'] = categorize_file(info['path'])
                all_files.append(info)

# Sort by category then path
all_files.sort(key=lambda x: (x['category'], x['path']))

# Generate document
lines = []
lines.append("=" * 80)
lines.append("EITAXI - PROMPTS COMPLETOS PARA REPLICAR EL PROYECTO DESDE CERO")
lines.append("=" * 80)
lines.append("")
lines.append(f"Generado: 16 de Abril 2026")
lines.append(f"Total de archivos: {len(all_files)}")
lines.append(f"Total de lineas de codigo: {sum(f['lines'] for f in all_files):,}")
lines.append(f"Framework: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Prisma")
lines.append(f"Base de datos: PostgreSQL (Supabase)")
lines.append(f"Auth: JWT (jose) - doble sistema (conductor + cliente)")
lines.append("")

# Table of contents
lines.append("=" * 80)
lines.append("INDICE DE CONTENIDOS")
lines.append("=" * 80)
lines.append("")

current_cat = ""
prompt_num = 0
for f in all_files:
    if f['category'] != current_cat:
        current_cat = f['category']
        cat_files = [x for x in all_files if x['category'] == current_cat]
        lines.append(f"### {current_cat} ({len(cat_files)} archivos)")
        for cf in cat_files:
            prompt_num += 1
            lines.append(f"  PROMPT {prompt_num}: {cf['path']} ({cf['lines']} lineas)")
        lines.append("")

lines.append("")
lines.append(f"TOTAL: {prompt_num} prompts")
lines.append("")
lines.append("=" * 80)
lines.append("PROMPTS DETALLADOS")
lines.append("=" * 80)
lines.append("")

# Detailed prompts
prompt_num = 0
for f in all_files:
    prompt_num += 1
    content = f['content']
    
    lines.append("-" * 80)
    lines.append(f"PROMPT {prompt_num}: {f['path']}")
    lines.append("-" * 80)
    lines.append("")
    lines.append(f"Tipo: {f['category']}")
    lines.append(f"Lineas: {f['lines']}")
    lines.append(f"Tamano: {f['size']:,} caracteres")
    lines.append("")
    
    imports = get_imports(content)
    if imports:
        lines.append("Imports principales:")
        for imp in imports:
            lines.append(f"  - {imp}")
        lines.append("")
    
    exports = get_exports(content)
    if exports:
        lines.append("Exports:")
        for exp in exports:
            lines.append(f"  - {exp}")
        lines.append("")
    
    funcs = get_functions(content)
    if funcs:
        lines.append("Funciones/Componentes:")
        for fn in funcs:
            lines.append(f"  - {fn}")
        lines.append("")
    
    hooks = get_hooks(content)
    if hooks:
        lines.append("Hooks React:")
        for h in hooks:
            lines.append(f"  - {h}")
        lines.append("")
    
    # For large files, include a summary; for small files, include everything
    if f['lines'] <= 100:
        lines.append("CONTENIDO COMPLETO:")
        lines.append("```")
        lines.append(content)
        lines.append("```")
    else:
        lines.append(f"CONTENIDO: {f['lines']} lineas (ver archivo fuente)")
        lines.append("")
        lines.append("Resumen del contenido:")
        # Take first 100 meaningful lines
        meaningful = [l for l in content.split('\n') if l.strip() and not l.strip().startswith('//') and not l.strip().startswith('*') and not l.strip().startswith('{') and not l.strip().startswith('}') and not l.strip() == '}' and len(l.strip()) > 10]
        for ml in meaningful[:40]:
            lines.append(f"  {ml.strip()[:120]}")
        if len(meaningful) > 40:
            lines.append(f"  ... y {len(meaningful) - 40} lineas mas")
    
    lines.append("")
    lines.append(f"PROMPT PARA RECREAR:")
    lines.append(f"Crea el archivo {f['path']} con {f['lines']} lineas de codigo.")
    lines.append(f"Tipo: {f['category']}.")
    
    if f['category'] == 'API Route':
        # Extract HTTP methods and route info
        methods = []
        for line in content.split('\n'):
            if 'export async function' in line.upper() or 'export function' in line.upper():
                methods.append(line.strip()[:100])
        if methods:
            lines.append("Metodos HTTP:")
            for m in methods:
                lines.append(f"  {m}")
    
    lines.append("")

# Write file
with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

total_lines = len(lines)
print(f"Documento generado: {OUTPUT}")
print(f"Lineas del documento: {total_lines:,}")
print(f"Archivos cubiertos: {len(all_files)}")
print(f"Prompts generados: {prompt_num}")
