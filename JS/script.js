// ============================================================================
// GENERADOR DE REPORTES ACADÉMICOS - Script Principal (VERSIÓN SEGURA)
// ============================================================================

// Estado global de la aplicación
let reportData = [];

// ============================================================================
// FUNCIONES DE SEGURIDAD (NUEVAS)
// ============================================================================

/**
 * Escapa caracteres HTML para atributos (previene XSS en value="...")
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado para atributos HTML
 */
function escapeAttr(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Escapa caracteres HTML para contenido (previene XSS en innerHTML)
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// FUNCIONES DE GESTIÓN DE BLOQUES
// ============================================================================

/**
 * Agrega un nuevo bloque al reporte
 * @param {string} type - Tipo de bloque: header, title, subtitle, text, code, image, ref
 */
function addBlock(type) {
    const id = Date.now();
    let newBlock = { id, type, content: "" };
    
    // Inicialización específica según el tipo de bloque
    if (type === 'header') {
        newBlock.hData = { 
            name: '', 
            group: '', 
            subject: '', 
            prof: '', 
            inst: '', 
            term: '', 
            date: '' 
        };
    }
    
    if (type === 'image') {
        newBlock.caption = '';
    }
    
    if (type === 'ref') {
        newBlock.refType = 'web';
        newBlock.refData = { 
            author: '', 
            title: '', 
            source: '', 
            year: '', 
            url: '' 
        };
    }
    
    if (type === 'ai') {
        newBlock.aiUsed = 'no'; // Por defecto: NO usó IA
        newBlock.aiData = {
            name: '',
            aiTool: '',
            date: '',
            purpose: '',
            prompt: '',
            attachments: '',
            rawResponse: ''
        };
    }
    
    // Inicialización del bloque de tabla
    if (type === 'table') {
        newBlock.caption = ''; // Descripción de la tabla
        newBlock.columns = 3; // Número de columnas por defecto
        newBlock.tableData = [
            ['', '', ''], // Fila de encabezados
            ['', '', '']  // Primera fila de datos
        ];
    }

    if (type === 'subtitle') {
        newBlock.headingLevel = "h2";
    }
    
    reportData.push(newBlock);
    render();
}

/**
 * Elimina un bloque del reporte
 * @param {number} id - ID del bloque a eliminar
 */
function deleteBlock(id) {
    reportData = reportData.filter(block => block.id !== id);
    render();
}

// ============================================================================
// FUNCIONES DE ACTUALIZACIÓN DE CONTENIDO
// ============================================================================

/**
 * Actualiza el contenido de un bloque
 * @param {number} id - ID del bloque
 * @param {string} value - Nuevo valor del contenido
 */
function updateContent(id, value) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        block.content = value;
        renderPreview();
    }
}

/**
 * Actualiza los datos del encabezado
 * @param {number} id - ID del bloque de encabezado
 * @param {string} field - Campo a actualizar
 * @param {string} value - Nuevo valor
 */
function updateHeader(id, field, value) {
    const block = reportData.find(b => b.id === id);
    if (block && block.hData) {
        block.hData[field] = value;
        renderPreview();
    }
}

/**
 * Actualiza el tipo de referencia
 * @param {number} id - ID del bloque de referencia
 * @param {string} type - Nuevo tipo (web, book, article)
 */
function updateRefType(id, type) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        block.refType = type;
        render();
    }
}

/**
 * Actualiza un campo de la referencia
 * @param {number} id - ID del bloque de referencia
 * @param {string} field - Campo a actualizar
 * @param {string} value - Nuevo valor
 */
function updateRef(id, field, value) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        if (!block.refData) {
            block.refData = { author: '', title: '', source: '', year: '', url: '' };
        }
        block.refData[field] = value;
        renderPreview();
    }
}

/**
 * Actualiza el pie de imagen
 * @param {number} id - ID del bloque de imagen
 * @param {string} value - Nuevo texto del pie de imagen
 */
function updateCaption(id, value) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        block.caption = value;
        renderPreview();
    }
}

/**
 * Procesa la carga de una imagen
 * @param {number} id - ID del bloque de imagen
 * @param {HTMLInputElement} input - Input file que contiene la imagen
 */
function handleImage(id, input) {
    if (!input.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const block = reportData.find(b => b.id === id);
        if (block) {
            block.content = e.target.result;
            renderPreview();
        }
    };
    reader.readAsDataURL(input.files[0]);
}

/**
 * Actualiza si se usó IA o no
 * @param {number} id - ID del bloque de IA
 * @param {string} value - 'yes' o 'no'
 */
function updateAIUsed(id, value) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        block.aiUsed = value;
        render(); // Re-renderizar para mostrar/ocultar campos
    }
}

/**
 * Actualiza un campo del bloque de IA
 * @param {number} id - ID del bloque de IA
 * @param {string} field - Campo a actualizar
 * @param {string} value - Nuevo valor
 */
function updateAI(id, field, value) {
    const block = reportData.find(b => b.id === id);
    if (block) {
        if (!block.aiData) {
            block.aiData = {
                name: '',
                aiTool: '',
                date: '',
                purpose: '',
                prompt: '',
                attachments: '',
                rawResponse: ''
            };
        }
        block.aiData[field] = value;
        renderPreview();
    }
}

// ============================================================================
// FUNCIONES DE GESTIÓN DE TABLAS
// ============================================================================

/**
 * Actualiza el número de columnas de una tabla
 * @param {number} id - ID del bloque de tabla
 * @param {number} cols - Número de columnas (1-6)
 */
function updateTableColumns(id, cols) {
    const block = reportData.find(b => b.id === id);
    if (!block || block.type !== 'table') return;
    
    // Validar rango
    cols = Math.max(1, Math.min(6, parseInt(cols) || 3));
    block.columns = cols;
    
    // Ajustar datos existentes al nuevo número de columnas
    block.tableData = block.tableData.map(row => {
        if (row.length > cols) {
            // Recortar si hay más columnas
            return row.slice(0, cols);
        } else if (row.length < cols) {
            // Agregar celdas vacías si faltan
            return [...row, ...Array(cols - row.length).fill('')];
        }
        return row;
    });
    
    render();
}

/**
 * Actualiza el contenido de una celda de la tabla
 * @param {number} id - ID del bloque de tabla
 * @param {number} row - Índice de fila
 * @param {number} col - Índice de columna
 * @param {string} value - Nuevo valor
 */
function updateTableCell(id, row, col, value) {
    const block = reportData.find(b => b.id === id);
    if (!block || block.type !== 'table') return;
    
    if (block.tableData[row] && block.tableData[row][col] !== undefined) {
        block.tableData[row][col] = value;
        renderPreview();
    }
}

/**
 * Agrega una nueva fila a la tabla
 * @param {number} id - ID del bloque de tabla
 */
function addTableRow(id) {
    const block = reportData.find(b => b.id === id);
    if (!block || block.type !== 'table') return;
    
    // Crear nueva fila con celdas vacías
    const newRow = Array(block.columns).fill('');
    block.tableData.push(newRow);
    render();
}

/**
 * Elimina la última fila de la tabla
 * @param {number} id - ID del bloque de tabla
 */
function removeTableRow(id) {
    const block = reportData.find(b => b.id === id);
    if (!block || block.type !== 'table') return;
    
    // No permitir eliminar si solo queda la fila de encabezados
    if (block.tableData.length <= 1) {
        alert('La tabla debe tener al menos la fila de encabezados.');
        return;
    }
    
    block.tableData.pop();
    render();
}

/**
 * Actualiza la descripción/caption de la tabla
 * @param {number} id - ID del bloque de tabla
 * @param {string} value - Nueva descripción
 */
function updateTableCaption(id, value) {
    const block = reportData.find(b => b.id === id);
    if (block && block.type === 'table') {
        block.caption = value;
        renderPreview();
    }
}

// ============================================================================
// REORDENAMIENTO DE BLOQUES
// ============================================================================
function makeBlockDraggable(blockElement, blockId) {
    blockElement.setAttribute('draggable', true);
    blockElement.classList.add('draggable-block');
    
    // Event Listeners para drag and drop
    blockElement.addEventListener('dragstart', handleDragStart);
    blockElement.addEventListener('dragover', handleDragOver);
    blockElement.addEventListener('dragleave', handleDragLeave);
    blockElement.addEventListener('drop', handleDrop);
    blockElement.addEventListener('dragend', handleDragEnd);
}

let draggedBlockId = null;

function handleDragStart(e) {
    draggedBlockId = parseInt(e.currentTarget.dataset.blockId);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const target = e.currentTarget;
    if (target.classList.contains('draggable-block')) {
        target.classList.add('drag-over');
    }

    return false;
}

function handleDragLeave(e) {
    const target = e.currentTarget;
    target.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    e.currentTarget.classList.remove('drag-over');

    const targetBlockId = parseInt(e.currentTarget.dataset.blockId);
    if (draggedBlockId !== targetBlockId) {
        reorderBlocks(draggedBlockId, targetBlockId);
    }

    return false;
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function reorderBlocks(draggedId, targetId) {
    const draggedIndex = reportData.findIndex(b => b.id === draggedId);
    const targetIndex = reportData.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedBlock] = reportData.splice(draggedIndex, 1);
    reportData.splice(targetIndex, 0, draggedBlock);

    render();
}

// ============================================================================
// FUNCIONES DE RENDERIZADO
// ============================================================================

/**
 * Renderiza todo el editor y la vista previa
 */
function render() {
    renderEditor();
    renderPreview();
}

/**
 * Renderiza solo el panel del editor (lado izquierdo)
 */
function renderEditor() {
    const editor = document.getElementById('editor-container');
    editor.innerHTML = ""; 

    reportData.forEach(block => {
        const div = document.createElement('div');
        div.className = 'block-card-container';
        div.dataset.blockId = block.id;
        
        const deleteBtn = `<button class="delete-btn" onclick="deleteBlock(${block.id})" title="Eliminar bloque">&times;</button>`;
        let blockHTML = "";

        switch(block.type) {
            case 'header':
                blockHTML = renderHeaderEditor(block, deleteBtn);
                break;
            case 'title':
                blockHTML = renderTitleEditor(block, deleteBtn);
                break;
            case 'subtitle':
                blockHTML = renderSubtitleEditor(block, deleteBtn);
                break;
            case 'text':
                blockHTML = renderTextEditor(block, deleteBtn);
                break;
            case 'code':
                blockHTML = renderCodeEditor(block, deleteBtn);
                break;
            case 'image':
                blockHTML = renderImageEditor(block, deleteBtn);
                break;
            case 'table':
                blockHTML = renderTableEditor(block, deleteBtn);
                break;
            case 'ref':
                blockHTML = renderRefEditor(block, deleteBtn);
                break;
            case 'ai':
                blockHTML = renderAIEditor(block, deleteBtn);
                break;
        }

        div.innerHTML = blockHTML;
        editor.appendChild(div);

        makeBlockDraggable(div, block.id);
    });
}

/**
 * Renderiza el editor de encabezado (AHORA SEGURO)
 */
function renderHeaderEditor(block, deleteBtn) {
    const d = block.hData;
    return `
        <div class="block-card header-card">
            ${deleteBtn}
            <label>Datos del Alumno / Encabezado:</label>
            <div class="grid-inputs">
                <input type="text" placeholder="Nombre del Alumno" value="${escapeAttr(d.name)}" oninput="updateHeader(${block.id}, 'name', this.value)">
                <input type="text" placeholder="Grupo" value="${escapeAttr(d.group)}" oninput="updateHeader(${block.id}, 'group', this.value)">
                <input type="text" placeholder="Materia" value="${escapeAttr(d.subject)}" oninput="updateHeader(${block.id}, 'subject', this.value)">
                <input type="text" placeholder="Profesor" value="${escapeAttr(d.prof)}" oninput="updateHeader(${block.id}, 'prof', this.value)">
                <input type="text" placeholder="Institución" value="${escapeAttr(d.inst)}" oninput="updateHeader(${block.id}, 'inst', this.value)">
                <input type="text" placeholder="Cuatrimestre" value="${escapeAttr(d.term)}" oninput="updateHeader(${block.id}, 'term', this.value)">
                <input type="date" value="${escapeAttr(d.date)}" oninput="updateHeader(${block.id}, 'date', this.value)">
            </div>
        </div>`;
}

/**
 * Renderiza el editor de título (AHORA SEGURO)
 */
function renderTitleEditor(block, deleteBtn) {
    return `
        <div class="block-card title-card">
            ${deleteBtn}
            <label>Título Principal:</label>
            <input type="text" class="editor-input" value="${escapeAttr(block.content)}" placeholder="Ej. Reporte de Práctica 1" oninput="updateContent(${block.id}, this.value)">
        </div>`;
}

/**
 * Actualiza el nivel del subtítulo
 */
function updateSubtitleLevel(blockId, level) {
    const block = reportData.find(b => b.id === blockId);
    if (block) {
        block.headingLevel = level;
        renderEditor();
        renderPreview();
    }
}

/**
 * Renderiza el editor de subtítulo (AHORA SEGURO)
 */
function renderSubtitleEditor(block, deleteBtn) {
    return `
        <div class="block-card subtitle-card">
            ${deleteBtn}
            <label>Subtítulo:</label>
            <div>
                <input type="text" class="editor-input" value="${escapeAttr(block.content)}" placeholder="Ej. Introducción o Metodología" oninput="updateContent(${block.id}, this.value)">
                <select onchange="updateSubtitleLevel(${block.id}, this.value)" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd">
                    <option value="h2" ${block.headingLevel === 'h2' ? 'selected' : ''}>H2</option>
                    <option value="h3" ${block.headingLevel === 'h3' ? 'selected' : ''}>H3</option>
                    <option value="h4" ${block.headingLevel === 'h4' ? 'selected' : ''}>H4</option>
                    <option value="h5" ${block.headingLevel === 'h5' ? 'selected' : ''}>H5</option>
                </select>
            </div>
        </div>`;
}

/**
 * Renderiza el editor de texto (AHORA SEGURO)
 */
function renderTextEditor(block, deleteBtn) {
    return `
        <div class="block-card text-card">
            ${deleteBtn}
            <label>Párrafo de Texto:</label>
            <textarea class="editor-input" placeholder="Escribe tu texto aquí..." oninput="updateContent(${block.id}, this.value)">${escapeHtml(block.content)}</textarea>
        </div>`;
}

/**
 * Renderiza el editor de código (AHORA SEGURO)
 */
function renderCodeEditor(block, deleteBtn) {
    return `
        <div class="block-card code-card">
            ${deleteBtn}
            <label>Bloque de Código:</label>
            <textarea class="code-input" placeholder="Pega tu código aquí..." oninput="updateContent(${block.id}, this.value)">${escapeHtml(block.content)}</textarea>
        </div>`;
}

/**
 * Renderiza el editor de imagen (AHORA SEGURO)
 */
function renderImageEditor(block, deleteBtn) {
    return `
        <div class="block-card image-card">
            ${deleteBtn}
            <label>Imagen:</label>
            <input type="file" accept="image/*" onchange="handleImage(${block.id}, this)" style="margin-top: 10px;">
            <input type="text" class="editor-input" placeholder="Descripción de la imagen" value="${escapeAttr(block.caption || '')}" oninput="updateCaption(${block.id}, this.value)">
            ${block.content ? `<img src="${escapeAttr(block.content)}" style="max-width: 100%; margin-top: 10px; border-radius: 4px;">` : ''}
        </div>`;
}

/**
 * Renderiza el editor de tabla con grid visual
 */
function renderTableEditor(block, deleteBtn) {
    const cols = block.columns || 3;
    const tableData = block.tableData || [['', '', ''], ['', '', '']];
    
    // Generar grid de inputs
    let gridHTML = '';
    for (let row = 0; row < tableData.length; row++) {
        for (let col = 0; col < cols; col++) {
            const value = tableData[row] && tableData[row][col] !== undefined ? tableData[row][col] : '';
            const placeholder = row === 0 ? `Encabezado ${col + 1}` : `Fila ${row}, Col ${col + 1}`;
            gridHTML += `<input 
                type="text" 
                placeholder="${placeholder}" 
                value="${escapeAttr(value)}" 
                oninput="updateTableCell(${block.id}, ${row}, ${col}, this.value)"
            >`;
        }
    }
    
    return `
        <div class="block-card table-card">
            ${deleteBtn}
            <label>Tabla</label>
            
            <!-- Controles de la tabla -->
            <div class="table-controls">
                <label>Columnas:</label>
                <input 
                    type="number" 
                    min="1" 
                    max="6" 
                    value="${cols}" 
                    onchange="updateTableColumns(${block.id}, this.value)"
                >
                <button class="btn-add-row" onclick="addTableRow(${block.id})" title="Agregar fila">
                    ➕ Fila
                </button>
                <button class="btn-remove-row" onclick="removeTableRow(${block.id})" title="Eliminar última fila">
                    ➖ Fila
                </button>
            </div>
            
            <!-- Grid de la tabla -->
            <div class="table-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
                ${gridHTML}
            </div>
            
            <!-- Descripción de la tabla -->
            <input 
                type="text" 
                class="editor-input" 
                placeholder="Descripción de la tabla" 
                value="${escapeAttr(block.caption || '')}" 
                oninput="updateTableCaption(${block.id}, this.value)"
            >
        </div>`;
}

/**
 * Renderiza el editor de referencia (AHORA SEGURO)
 */
function renderRefEditor(block, deleteBtn) {
    const r = block.refData || {};
    return `
        <div class="block-card ref-card">
            ${deleteBtn}
            <label>Referencia Bibliográfica (IEEE):</label>
            <select onchange="updateRefType(${block.id}, this.value)" style="margin-top: 10px; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                <option value="web" ${block.refType === 'web' ? 'selected' : ''}>Página Web</option>
                <option value="book" ${block.refType === 'book' ? 'selected' : ''}>Libro</option>
                <option value="article" ${block.refType === 'article' ? 'selected' : ''}>Artículo</option>
            </select>
            <input type="text" class="editor-input" placeholder="Autor(es)" value="${escapeAttr(r.author)}" oninput="updateRef(${block.id}, 'author', this.value)">
            <input type="text" class="editor-input" placeholder="Título" value="${escapeAttr(r.title)}" oninput="updateRef(${block.id}, 'title', this.value)">
            <input type="text" class="editor-input" placeholder="${block.refType === 'book' ? 'Editorial' : 'Fuente/Revista'}" value="${escapeAttr(r.source)}" oninput="updateRef(${block.id}, 'source', this.value)">
            <input type="text" class="editor-input" placeholder="Año" value="${escapeAttr(r.year)}" oninput="updateRef(${block.id}, 'year', this.value)">
            ${block.refType === 'web' ? `<input type="url" class="editor-input" placeholder="URL completa" value="${escapeAttr(r.url)}" oninput="updateRef(${block.id}, 'url', this.value)">` : ''}
        </div>`;
}

/**
 * Renderiza el editor de declaración de uso de IA
 */
function renderAIEditor(block, deleteBtn) {
    const ai = block.aiData || {};
    
    // Obtener el nombre del estudiante del header si existe
    const headerBlock = reportData.find(b => b.type === 'header');
    const studentName = headerBlock && headerBlock.hData ? headerBlock.hData.name : '';
    
    return `
        <div class="block-card ai-card">
            ${deleteBtn}
            <label><strong>Declaración de Uso de Inteligencia Artificial</strong></label>

			<div style="margin-top: 15px;">
                <label>¿Utilizaste IA para este trabajo?</label>
                <div style="margin-top: 8px;">
                    <label style="margin-right: 20px; cursor: pointer;">
                        <input type="radio" name="aiUsed_${block.id}" value="no"
                            ${block.aiUsed === 'no' ? 'checked' : ''}
                            onchange="updateAIUsed(${block.id}, 'no')">
                        No
                    </label>
                    <label style="cursor: pointer;">
                        <input type="radio" name="aiUsed_${block.id}" value="yes"
                            ${block.aiUsed === 'yes' ? 'checked' : ''}
                            onchange="updateAIUsed(${block.id}, 'yes')">
                        Sí
                    </label>
                </div>
            </div>
            
            ${block.aiUsed === 'no' ? `
                <div style="margin-top: 15px; padding: 15px; background: #e8f8f5; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #555;">
                        <strong>Nombre del estudiante que declara:</strong>
                    </p>
                    <input type="text" class="editor-input" placeholder="Nombre completo del estudiante"
                        value="${escapeAttr(ai.name)}"
                        oninput="updateAI(${block.id}, 'name', this.value)">
                </div>
            ` : ''}
            
            ${block.aiUsed === 'yes' ? `
                <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            
                    <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #555;">
                        <strong>Completa los siguientes campos para cada uso de IA:</strong>
                    </p>
                    <input type="text" class="editor-input" placeholder="Nombre del estudiante" value="${escapeAttr(ai.name)}" oninput="updateAI(${block.id}, 'name', this.value)">
                    <input type="text" class="editor-input" placeholder="IA utilizada (ej. ChatGPT, Claude, Gemini)" value="${escapeAttr(ai.aiTool)}" oninput="updateAI(${block.id}, 'aiTool', this.value)">
                    <input type="date" class="editor-input" placeholder="Fecha de uso" value="${escapeAttr(ai.date)}" oninput="updateAI(${block.id}, 'date', this.value)">
                    <input type="text" class="editor-input" placeholder="Propósito (ej. depuración, investigación, redacción)" value="${escapeAttr(ai.purpose)}" oninput="updateAI(${block.id}, 'purpose', this.value)">
                    <textarea class="editor-input" placeholder="Prompt utilizado" oninput="updateAI(${block.id}, 'prompt', this.value)">${escapeHtml(ai.prompt)}</textarea>
                    <input type="text" class="editor-input" placeholder="Archivos adjuntos suministrados (ej. reporte.docx, libro.pdf, www.link.com)" value="${escapeAttr(ai.attachments)}" oninput="updateAI(${block.id}, 'attachments', this.value)">
                    <textarea class="editor-input" placeholder="Respuesta en crudo (raw response)" style="min-height: 120px;" oninput="updateAI(${block.id}, 'rawResponse', this.value)">${escapeHtml(ai.rawResponse)}</textarea>
                </div>
            ` : ''}
        </div>`;
}

/**
 * Renderiza solo la vista previa (lado derecho)
 */
function renderPreview() {
    const preview = document.getElementById('preview-container');
    let figureCounter = 0;
    let tableCounter = 0;  // Contador para tablas
    let refCounter = 0;

    preview.innerHTML = reportData.map(block => {
        switch(block.type) {
            case 'title':
                return `<h1 class="p-title">${escapeHtml(block.content)}</h1>`;
            
            case 'subtitle':
                return `<${block.headingLevel} class="p-subtitle ${block.headingLevel}">${escapeHtml(block.content)}</${block.headingLevel}>`;
            
            case 'text':
                const textWithBreaks = escapeHtml(block.content).replace(/\n/g, '<br>');
                return `<p class="p-text">${textWithBreaks}</p>`;
            
            case 'image':
                figureCounter++;
                return `
                    <div class="preview-image-container">
                        ${block.content ? `<img src="${escapeAttr(block.content)}" alt="Figura ${figureCounter}">` : '<div class="placeholder">Imagen no seleccionada</div>'}
                        <p class="figure-caption"><strong>Figura ${figureCounter}:</strong> <em>${escapeHtml(block.caption || '')}</em></p>
                    </div>`;
            
            case 'table':
                tableCounter++;
                if (!block.tableData || block.tableData.length === 0) return '';
                
                // Generar HTML de la tabla
                let tableHTML = '<table><thead><tr>';
                
                // Encabezados (primera fila)
                const headers = block.tableData[0] || [];
                headers.forEach(cell => {
                    tableHTML += `<th>${escapeHtml(cell)}</th>`;
                });
                tableHTML += '</tr></thead><tbody>';
                
                // Filas de datos (resto de filas)
                for (let i = 1; i < block.tableData.length; i++) {
                    tableHTML += '<tr>';
                    const row = block.tableData[i] || [];
                    row.forEach(cell => {
                        tableHTML += `<td>${escapeHtml(cell)}</td>`;
                    });
                    tableHTML += '</tr>';
                }
                
                tableHTML += '</tbody></table>';
                
                return `
                    <div class="preview-table-container">
                        ${tableHTML}
                        <p class="table-caption"><strong>Tabla ${tableCounter}:</strong> <em>${escapeHtml(block.caption || '')}</em></p>
                    </div>`;
            
            case 'code':
                return `<pre class="code-preview"><code>${escapeHtml(block.content)}</code></pre>`;
            
            case 'header':
                if (!block.hData) return '';
                const d = block.hData;
                return `
                    <div class="p-header">
                        <p><strong>Institución:</strong> ${escapeHtml(d.inst)}</p>
                        <p><strong>Materia:</strong> ${escapeHtml(d.subject)} ${d.term ? `(${escapeHtml(d.term)}° Cuatrimestre)` : ''}</p>
                        <p><strong>Profesor:</strong> ${escapeHtml(d.prof)}</p>
                        <p><strong>Alumno:</strong> ${escapeHtml(d.name)} ${d.group ? `| <strong>Grupo:</strong> ${escapeHtml(d.group)}` : ''}</p>
                        <p><strong>Fecha:</strong> ${escapeHtml(d.date)}</p>
                        <hr>
                    </div>`;
            
            case 'ref':
                if (!block.refData) return '';
                refCounter++;
                const { author, title, source, year, url } = block.refData;
                let refText = formatIEEEReference(block.refType, author, title, source, year, url);
                return `
                    <div class="p-ref-ieee">
                        <div class="ref-num">[${refCounter}]</div>
                        <div class="ref-content">${refText}</div>
                    </div>`;
            
            case 'ai':
                if (!block.aiData) return '';
                const ai = block.aiData;
                
                // Obtener el nombre del estudiante del header
                const headerBlock = reportData.find(b => b.type === 'header');
                const studentName = headerBlock && headerBlock.hData ? headerBlock.hData.name : '[Nombre del estudiante]';

				if (block.aiUsed === 'no') {
                    // Usar el nombre ingresado en el bloque, o el del header como fallback
                    const declarantName = ai.name || studentName;
                
                    return `
                        <div class="p-ai-declaration">
                            <p class="p-text" style="text-align: justify;">
                                Yo, <strong>${escapeHtml(declarantName)}</strong>, declaro que <strong>NO</strong> he utilizado herramientas de Inteligencia Artificial para la elaboración de este trabajo académico.
                                Afirmo que cuento con evidencias físicas y/o digitales que demuestran mi autoría, incluyendo pero no limitándose a:
                                documentos manuscritos, materiales impresos con anotaciones o subrayado, historial de versiones de documentos electrónicos, o commits en repositorios de código.
                                <br><br>
                                Reconozco y acepto que el profesor se reserva el derecho de solicitar dichas evidencias en cualquier momento,
                                especialmente cuando existan sospechas o se detecten conductas que atenten contra la integridad académica,
                                tales como plagio o uso no reportado de herramientas de IA.
                            </p>
                        </div>`;
                } else {
                    return `
                        <div class="p-ai-declaration">
                            <div style="margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Nombre del estudiante:</strong> ${escapeHtml(ai.name || studentName)}</p>
                                <p style="margin: 5px 0;"><strong>IA utilizada:</strong> ${escapeHtml(ai.aiTool)}</p>
                                <p style="margin: 5px 0;"><strong>Fecha de uso:</strong> ${escapeHtml(ai.date)}</p>
                                <p style="margin: 5px 0;"><strong>Propósito:</strong> ${escapeHtml(ai.purpose)}</p>
                                
                                <p style="margin: 15px 0 5px 0;"><strong>Prompt utilizado:</strong></p>
                                <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 0.9em;">${escapeHtml(ai.prompt)}</pre>
                                
                                ${ai.attachments ? `<p style="margin: 10px 0 5px 0;"><strong>Archivos suministrados:</strong> ${escapeHtml(ai.attachments)}</p>` : ''}
                                
                                <p style="margin: 15px 0 5px 0;"><strong>Respuesta en crudo (raw):</strong></p>
                                <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 0.85em; max-height: 300px; overflow-y: auto;">${escapeHtml(ai.rawResponse)}</pre>
                            </div>
                        </div>`;
                }
            
            default:
                return "";
        }
    }).join('');
}

// ============================================================================
// FUNCIONES DE EXPORTACIÓN
// ============================================================================

/**
 * Exporta el reporte como archivo de texto plano
 */
function exportTXT() {
    let textContent = [];
    let figureCount = 0;
    let tableCount = 0;
    let refCount = 0;

    const SEP_MAIN = '='.repeat(60);
    const SEP_SUB = '-'.repeat(40);

    textContent.push(SEP_MAIN);
    textContent.push("REPORTE ACADÉMICO - EXPORTACIÓN TXT");
    textContent.push(SEP_MAIN);
    textContent.push('')

    reportData.forEach(block => {
        switch(block.type) {
            case 'header':
                if (block.hData) {
                    const d = block.hData;
                    textContent.push(`DATOS DEL ESTUDIANTE`);
                    textContent.push(SEP_SUB);
                    textContent.push(`Institución: ${d.inst}`);
                    textContent.push(`Materia: ${d.subject} (${d.term}° Cuatrimestre)`);
                    textContent.push(`Profesor: ${d.prof}`);
                    textContent.push(`Alumno: ${d.name} | Grupo: ${d.group}`);
                    textContent.push(`Fecha: ${d.date}`);
                    textContent.push('');
                }
                break;
            
            case 'title':
                textContent.push('');
                textContent.push(SEP_MAIN);
                textContent.push(block.content.toUpperCase());
                textContent.push(SEP_MAIN);
                textContent.push('');
                break;
            
            case 'subtitle':
                textContent.push('');
                textContent.push(SEP_SUB);
                textContent.push(block.content);
                textContent.push(SEP_SUB);
                textContent.push('');
                break;
            
            case 'text':
                textContent.push(block.content);
                textContent.push('');
                break;
            
            case 'code':
                textContent.push('');
                textContent.push(`[INICIO DE CÓDIGO]`);
                textContent.push(SEP_SUB);
                textContent.push(block.content);
                textContent.push(SEP_SUB);
                textContent.push('[FIN DE CÓDIGO]');
                textContent.push('');
                break;
            
            case 'image':
                figureCount++;
                textContent.push('');
                textContent.push(`[FIGURA ${figureCount}]`);
                textContent.push(`Descripción: ${block.caption || 'Sin descripción'}`);
                textContent.push('(La imagen no puede ser exportada a formato TXT)');
                textContent.push('');
                break;
            
            case 'table':
                tableCount++;
                textContent.push('');
                textContent.push(`[TABLA ${tableCount}]`);
                textContent.push(SEP_MAIN);
                
				if (block.tableData && block.tableData.length > 0) {
                    const cols = block.columns || block.tableData[0].length;
                    const colWidths = [];
                    const MAX_COL_WIDTH = 30;
                
                    // 1. Calcular anchos de columna
                    for (let col = 0; col < cols; col++) {
                        let maxWidth = 10;
                        for (let row = 0; row < block.tableData.length; row++) {
                            const cellContent = String(block.tableData[row][col] || '');
                            // Si el texto es corto, usamos su longitud; si es largo, limitamos a MAX_COL_WIDTH
                            maxWidth = Math.max(maxWidth, Math.min(cellContent.length, MAX_COL_WIDTH));
                        }
                        colWidths.push(maxWidth);
                    }
                
                    // Función auxiliar para dividir texto en fragmentos (Word Wrap)
                    const wrapText = (text, width) => {
                        const lines = [];
                        const str = String(text || '');
                        for (let i = 0; i < str.length; i += width) {
                            lines.push(str.substring(i, i + width));
                        }
                        return lines.length > 0 ? lines : [''];
                    };
                
                    // Función para rellenar con espacios
                    const pad = (str, width) => {
                        return str + ' '.repeat(Math.max(0, width - str.length));
                    };
                
                    // 2. Renderizar cada fila del tableData
                    for (let row = 0; row < block.tableData.length; row++) {
                        // Convertimos cada celda de esta fila en un array de líneas envueltas
                        const cellLines = [];
                        let maxLinesInRow = 1;
                
                        for (let col = 0; col < cols; col++) {
                            const wrapped = wrapText(block.tableData[row][col], colWidths[col]);
                            cellLines.push(wrapped);
                            maxLinesInRow = Math.max(maxLinesInRow, wrapped.length);
                        }
                
                        // Renderizamos las sub-líneas para que la fila crezca verticalmente
                        for (let l = 0; l < maxLinesInRow; l++) {
                            let line = '| ';
                            for (let col = 0; col < cols; col++) {
                                const content = cellLines[col][l] || ''; // Si no hay más texto en esta col, celda vacía
                                line += pad(content, colWidths[col]) + ' | ';
                            }
                            textContent += line + '\n';
                        }

                        let separator = '+-';
                        for (let col = 0; col < cols; col++) {
                            separator += '-'.repeat(colWidths[col]) + '-+-';
                        }
                        textContent += separator + '\n';
                    }
                }
				// =====================================================================
                
                textContent.push(SEP_MAIN);
                textContent.push(`Descripción: ${block.caption || 'Sin descripción'}`);
                textContent.push('');
                break;
            
            case 'ref':
                if (block.refData) {
                    refCount++;
                    const formattedRef = formatTXTReference(block.refData, block.refType, refCount);
                    textContent.push(formattedRef);
                    textContent.push('');
                }
                break;
            
            case 'ai':
                if (block.aiData) {
					const ai = block.aiData;  // Definir ai aquí para usarlo en ambos casos
                    const headerBlock = reportData.find(b => b.type === 'header');
                    const studentName = headerBlock && headerBlock.hData ? headerBlock.hData.name : '[Nombre del estudiante]';
                    
                    textContent.push('');
                    textContent.push(SEP_MAIN);
                    textContent.push(`DECLARACIÓN DE USO DE INTELIGENCIA ARTIFICIAL`);
                    textContent.push(SEP_MAIN);
                    textContent.push('');
                    
                    if (block.aiUsed === 'no') {
						const declarantName = ai.name || studentName;
						textContent.push(`Yo, ${declarantName}, declaro que NO he utilizado herramientas de`);
                        textContent.push(`Inteligencia Artificial para la elaboración de este trabajo académico.`);
                        textContent.push(`Afirmo que cuento con evidencias físicas y/o digitales que demuestran`);
                        textContent.push(`mi autoría, incluyendo: documentos manuscritos, materiales impresos con`);
                        textContent.push(`anotaciones o subrayado, historial de versiones de documentos electrónicos,`);
                        textContent.push(`o commits en repositorios de código.`);
                        textContent.push('');
                        textContent.push(`Reconozco que el profesor se reserva el derecho de solicitar dichas`);
                        textContent.push(`evidencias cuando existan sospechas o se detecten conductas que atenten`);
                        textContent.push(`contra la integridad académica.`);
                    } else {
                        const ai = block.aiData;
                        textContent.push(`Estudiante: ${ai.name || studentName}`);
                        textContent.push(`IA utilizada: ${ai.aiTool}`);
                        textContent.push(`Fecha: ${ai.date}`);
                        textContent.push(`Propósito: ${ai.purpose}`);
                        textContent.push('');
                        textContent.push(`Prompt utilizado:`);
                        textContent.push(SEP_SUB);
                        textContent.push(`${ai.prompt}`);
                        textContent.push(SEP_SUB);
                        textContent.push('');

                        if (ai.attachments) {
                            textContent.push(`Archivos suministrados: ${ai.attachments}\n`);
                        }

                        textContent.push(`Respuesta en crudo:`);
                        textContent.push(SEP_SUB);
                        textContent.push(`${ai.rawResponse}`);
                        textContent.push(`${SEP_SUB}\n`);
                    }
                }
                break;
        }
    });

    downloadFile(textContent.join('\n'), 'reporte_academico.txt');
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Funciones para exportTXT
 */
function formatTXTReference(data, type, index) {
    const base = `[${index}] ${data.author}, "${data.title}," ${data.source}, ${data.year}.`;
    if (type === 'web') {
        return `${base} [En línea]. Disponible: ${data.url}\n`;
    }

    return base;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

/**
 * Formatea una referencia según el estilo IEEE
 */
function formatIEEEReference(type, author, title, source, year, url) {
    let refText = "";
    
    if (type === 'book') {
        refText = `${escapeHtml(author)}, <em>${escapeHtml(title)}</em>. ${escapeHtml(source)}, ${escapeHtml(year)}.`;
    } else if (type === 'web') {
        refText = `${escapeHtml(author)}, "${escapeHtml(title)}," <em>${escapeHtml(source)}</em>, ${escapeHtml(year)}. [En línea]. Disponible: ${escapeHtml(url)}`;
    } else if (type === 'article') {
        refText = `${escapeHtml(author)}, "${escapeHtml(title)}," <em>${escapeHtml(source)}</em>, ${escapeHtml(year)}.`;
    }
    
    return refText;
}

/**
 * Guarda el estado actual en localStorage (opcional)
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('reportData', JSON.stringify(reportData));
        console.log('Reporte guardado automáticamente');
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
    }
}

/**
 * Carga el estado desde localStorage (opcional)
 */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('reportData');
        if (saved) {
            reportData = JSON.parse(saved);
            render();
            console.log('Reporte recuperado');
        }
    } catch (e) {
        console.error('Error al cargar desde localStorage:', e);
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Cargar datos guardados al iniciar (opcional - comentado por ahora)
// document.addEventListener('DOMContentLoaded', function() {
//     loadFromLocalStorage();
// });

// Autoguardado cada 30 segundos (opcional - comentado por ahora)
// setInterval(saveToLocalStorage, 30000);

// ============================================================================
// GESTIÓN DE TEMAS
// ============================================================================

/**
 * Cambia el tema visual de la aplicación
 * @param {string} theme - 'tsw', 'upy', o 'upp'
 */
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selectedTheme', theme);
    console.log(`Tema cambiado a: ${theme}`);
}

/**
 * Carga el tema guardado al iniciar
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'tsw';
    document.body.setAttribute('data-theme', savedTheme);
    const selector = document.getElementById('themeSelector');
    if (selector) {
        selector.value = savedTheme;
    }
}

// Cargar tema al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadSavedTheme();
});
