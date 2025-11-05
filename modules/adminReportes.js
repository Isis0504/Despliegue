// modules/adminReportes.js
import { supabase } from "../js/supabaseClient.js"; 
import { exportToXLSX, mostrarMensaje } from "../js/utils.js";

const TABLAS = [
    // La clave 'tabla' usa tu nombre real en la DB. La clave 'orden' usa tu columna de fecha.
    { id: "pagos", nombre: "Pagos", tabla: "pagos", orden: "creado_en" },
    { id: "reservas", nombre: "Reservas", tabla: "reservas", orden: "creado_en" },
    { id: "certificados", nombre: "Certificados", tabla: "solicitudes_certificados", orden: "fecha_solicitud" },
    { id: "seguimiento", nombre: "Seguimiento Solicitudes", tabla: "seguimiento", orden: "fecha" },
];

export function render(contenedor) {
    contenedor.id = "modReportes";
    contenedor.innerHTML = `
        <div class="rep-card card">
            <header><h2 class="mod-rep-titulo">📊 Descarga de Reportes</h2></header>
            <div class="rep-content">
                <p class="rep-descripcion">Selecciona uno de los siguientes reportes para descargar la información en formato Excel:</p>
                <div class="mod-rep-botones-contenedor">
                    ${TABLAS.map(t => 
                        `<button id="btnDescargar_${t.id}" data-tabla="${t.tabla}" data-nombre="${t.nombre}" data-orden="${t.orden}" class="btn btnPrimario mod-rep-btn-descarga">${t.nombre}</button>`
                    ).join('')}
                </div>
                <p class="rep-nota"><small>⚠️ La descarga puede tardar unos segundos dependiendo del volumen de datos.</small></p>
            </div>
        </div>
    `;

    document.querySelectorAll(".mod-rep-btn-descarga").forEach(btn => {
        btn.addEventListener("click", () => handleDescargar(btn));
    });
}

async function handleDescargar(button) {
    const tabla = button.dataset.tabla;
    const nombre = button.dataset.nombre;
    const columnaOrden = button.dataset.orden; 
    
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = `Cargando ${nombre}...`;
    
    // Obtener todos los datos de la tabla, usando la columna de orden específica
    const { data, error } = await supabase
        .from(tabla)
        .select("*") 
        .order(columnaOrden, { ascending: false }); 

    button.disabled = false;
    button.textContent = originalText;

    if (error) {
        mostrarMensaje(`Error al cargar datos de ${nombre}: ${error.message}`, "error");
        console.error(error);
        return;
    }

    const filename = `${nombre.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportToXLSX(data, filename, nombre);
}