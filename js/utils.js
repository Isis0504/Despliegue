// js/utils.js
// utils.js

// ⬅️ AGREGADO: Lista de palabras a censurar
const MALAS_PALABRAS = ['estúpido', 'idiota', 'grosería1', 'grosería2', 'mierda', 'pendejo', 'imbécil', 'cabrón']; 

export function formatearFecha(fecha) {
    if (!fecha) return "";
    const f = new Date(fecha);
    if (isNaN(f)) return fecha; // si no es una fecha válida, la devuelve tal cual
    return f.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

// Si tienes otras utilidades, asegúrate de exportarlas también, por ejemplo:
export function mostrarMensaje(mensaje, tipo = "info") {
    // 1. Crear el contenedor principal si no existe (fijo en el HTML)
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // 2. Crear el elemento del mensaje (toast)
    const toast = document.createElement('div');
    // Usamos 'toast-message' en lugar de 'mensaje' y añadimos la clase de tipo
    toast.className = `toast-message ${tipo}`; 
    toast.textContent = mensaje;
    
    // 3. Agregar el toast al contenedor (se usará flex-direction: column-reverse para que el más nuevo esté abajo)
    container.appendChild(toast);
    
    // 4. Forzar reflow y aplicar la clase 'show' para iniciar la animación de entrada
    void toast.offsetWidth; 
    toast.classList.add('show');

    // 5. Configurar la desaparición automática (ej: 3 segundos)
    const duracion = 3000; 
    setTimeout(() => {
        // Inicia la transición de salida (translateX(100%) y opacidad 0)
        toast.classList.remove('show');
        
        // Espera a que termine la animación de salida (0.3s definido en CSS) antes de eliminar el elemento
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300); 
    }, duracion);
}

/**
* @param {string} mensaje - La pregunta de confirmación.
* @returns {Promise<boolean>} - Resuelve a 'true' si acepta, 'false' si cancela.
*/
export function mostrarConfirmacion(mensaje) {
    return new Promise((resolve) => {
        // 1. Crear el modal
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal">
                <p>${mensaje}</p>
                <div class="modal-actions">
                    <button id="modal-cancel" class="btnSecundario">Cancelar</button>
                    <button id="modal-accept" class="btnPrimario">Aceptar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 2. Lógica para resolver la promesa
        const cleanup = (result) => {
            modal.remove();
            resolve(result);
        };

        // 3. Añadir listeners
        document.getElementById('modal-accept').addEventListener('click', () => cleanup(true));
        document.getElementById('modal-cancel').addEventListener('click', () => cleanup(false));

        // Permitir cerrar al hacer clic en el fondo (opcional)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup(false);
            }
        });
    });
}

// ⬅️ AGREGADO: Función para filtrar contenido (usada en mensajes.js)
/**
 * Filtra un mensaje reemplazando las malas palabras con asteriscos.
 * @param {string} mensaje El mensaje a filtrar.
 * @returns {string} El mensaje filtrado.
 */
export function filtrarMalasPalabras(mensaje) {
    let mensajeFiltrado = mensaje;
    MALAS_PALABRAS.forEach(palabra => {
        // Expresión regular para buscar la palabra completa (insensible a mayúsculas/minúsculas)
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi'); 
        const reemplazo = '*'.repeat(palabra.length);
        mensajeFiltrado = mensajeFiltrado.replace(regex, reemplazo);
    });
    return mensajeFiltrado;
}


// js/utils.js
export async function cargarModulo(idModulo) {
    const seccion = document.getElementById(idModulo);
    if (!seccion) return;

    // Detecta la ruta base
    // Si estás en /admin/, /residente/ o /comite/ la ruta a /modules/ es ../modules/
    // Si estás en la raíz (ej: index.html), la ruta a /modules/ es ./modules/
    const baseRuta = window.location.pathname.includes("/admin/") ||
                        window.location.pathname.includes("/residente/") ||
                        window.location.pathname.includes("/comite/")
        ? "../modules/" // Desde dashboard.html dentro de una subcarpeta
        : "./modules/"; // Desde un archivo en la raíz

    const mapa = {
        modPerfil: `${baseRuta}perfil.js`,
        modPagos: `${baseRuta}pagos.js`,
        modSolicitudes: `${baseRuta}solicitudes.js`,
        modReservas: `${baseRuta}reservas.js`,
        modCertificados: `${baseRuta}certificados.js`,
        modMensajes: `${baseRuta}mensajes.js`,
        modSeguimiento: `${baseRuta}seguimiento.js`,
        modReportes: `${baseRuta}adminReportes.js`,
    };

    const archivo = mapa[idModulo];
    if (!archivo) {
        seccion.innerHTML = "<p>Módulo no encontrado.</p>";
        return;
    }

    try {
        seccion.innerHTML = "<p>Cargando módulo...</p>";
        const modulo = await import(archivo);
        seccion.innerHTML = "";
        modulo.render(seccion);
    } catch (error) {
        seccion.innerHTML = `<p>Error al cargar el módulo: ${error.message}</p>`;
        console.error("Error al cargar el módulo:", error);
    }
}

/**
* Exporta un array de objetos a un archivo XLSX.
* @param {Array<Object>} data El array de objetos a exportar.
* @param {string} filename Nombre del archivo de salida.
* @param {string} sheetName Nombre de la hoja de cálculo.
*/
export function exportToXLSX(data, filename = 'reporte', sheetName = 'Datos') {
    if (!window.XLSX) {
        return mostrarMensaje("Error: La librería XLSX no está cargada. Verifica el script en el HTML.", "error");
    }

    if (!data || data.length === 0) {
        return mostrarMensaje("No hay datos para exportar.", "alerta");
    }

    // 1. Crear la hoja de trabajo
    const ws = window.XLSX.utils.json_to_sheet(data);

    // 2. Crear el libro de trabajo
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 3. Escribir y descargar el archivo
    window.XLSX.writeFile(wb, `${filename}.xlsx`);
    mostrarMensaje("Reporte exportado con éxito!", "success");
}