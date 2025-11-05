import { verificarSesion, logout } from "../js/auth.js";
import { cargarModulo } from "../js/utils.js";

verificarSesion(["administrador"]);

const usuario = JSON.parse(localStorage.getItem("usuario"));
document.getElementById("nombreUsuario").textContent = usuario?.nombre || "Administrador";

const mainTabs = document.getElementById("mainTabs");

const botones = [
  { id: "modPerfil", nombre: "Perfiles" },
  { id: "modPagos", nombre: "Pagos" },
  { id: "modReservas", nombre: "Reservas" },
  { id: "modCertificados", nombre: "Certificados" },
  { id: "modMensajes", nombre: "Comunicaciones" },
  { id: "modSeguimiento", nombre: "Seguimiento" },
  { id: "modReportes", nombre: "Reportes (Excel)" },
  { id: "logout", nombre: "Cerrar Sesión" },
];

let moduloActivoId = "modPerfil";

function montarNavegacion() {
    mainTabs.innerHTML = botones
        .map((b) => {
            const extraClass = b.id === "logout" ? "logoutBtn" : "";
            // ⬅️ Usamos 'tabBtn' para la funcionalidad general y 'active' para el módulo actual
            const activeClass = b.id === moduloActivoId ? " active" : ""; 
            return `<button class="tabBtn ${extraClass}${activeClass}" data-id="${b.id}">${b.nombre}</button>`;
        })
        .join("");
}

function handleCambioModulo(nuevoModuloId) {
    if (nuevoModuloId === moduloActivoId) return;

    // 1. Ocultar módulo anterior y desactivar botón
    const moduloAnterior = document.getElementById(moduloActivoId);
    if (moduloAnterior) moduloAnterior.classList.add("hidden");

    const btnAnterior = document.querySelector(`.tabBtn[data-id="${moduloActivoId}"]`);
    if (btnAnterior) btnAnterior.classList.remove("active");

    // 2. Actualizar ID activo
    moduloActivoId = nuevoModuloId;

    // 3. Activar nuevo botón
    const nuevoBtn = document.querySelector(`.tabBtn[data-id="${nuevoModuloId}"]`);
    if (nuevoBtn) nuevoBtn.classList.add("active");

    // 4. Mostrar y cargar nuevo módulo
    const seccion = document.getElementById(nuevoModuloId);
    if (seccion) {
        seccion.classList.remove("hidden");
        cargarModulo(nuevoModuloId);
    }
}

// Lógica de clics
document.addEventListener("DOMContentLoaded", () => {
    // 1. Montar navegación inicial
    montarNavegacion();

    // 2. Lógica de clics
    document.querySelectorAll(".tabBtn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            if (id === "logout") {
                // ⬅️ Usar la función importada con el history.replaceState
                logout(); 
                return;
            }

            handleCambioModulo(id);
        });
    });

    // 3. Cargar el módulo inicial
    // Asegurarse de que solo el módulo activo esté visible al inicio
    document.querySelectorAll(".module").forEach(m => m.classList.add("hidden"));
    
    const moduloInicial = document.getElementById(moduloActivoId);
    if (moduloInicial) {
        moduloInicial.classList.remove("hidden");
        cargarModulo(moduloActivoId);
    }
});
