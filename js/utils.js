// js/utils.js
// utils.js

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

// js/utils.js
export async function cargarModulo(idModulo) {
  const seccion = document.getElementById(idModulo);
  if (!seccion) return;

  // Detecta si estás en /admin/, /residente/ o /comite/
  const baseRuta = window.location.pathname.includes("/admin/") ||
                   window.location.pathname.includes("/residente/") ||
                   window.location.pathname.includes("/comite/")
    ? "../modules/"
    : "./modules/";

  const mapa = {
    modPerfil: `${baseRuta}perfil.js`,
    modPagos: `${baseRuta}pagos.js`,
    modSolicitudes: `${baseRuta}solicitudes.js`,
    modReservas: `${baseRuta}reservas.js`,
    modCertificados: `${baseRuta}certificados.js`,
    modMensajes: `${baseRuta}mensajes.js`,
    modSeguimiento: `${baseRuta}seguimiento.js`,
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
 * @param {string} mensaje El texto que se mostrará.
 * @param {('success'|'error'|'info')} [tipo='info'] El tipo de mensaje (para color).
 */





