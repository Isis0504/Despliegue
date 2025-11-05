import { verificarSesion, logout } from "../js/auth.js";
import { cargarModulo } from "../js/utils.js";

verificarSesion(["residente"]);

const usuario = JSON.parse(localStorage.getItem("usuario"));
document.getElementById("nombreUsuario").textContent = usuario?.nombre || "Residente";

const mainTabs = document.getElementById("mainTabs");

const botones = [
  { id: "modPerfil", nombre: "Mi Perfil" },
  { id: "modPagos", nombre: "Mis Pagos" },
  { id: "modSolicitudes", nombre: "Solicitudes" },
  { id: "modReservas", nombre: "Reservas" },
  { id: "modCertificados", nombre: "Certificados" },
  { id: "modMensajes", nombre: "Comunicaciones" },
  { id: "logout", nombre: "Cerrar Sesión" },
];

// Mostrar nombre del usuario
const usuarioData = JSON.parse(localStorage.getItem("usuario"));
document.getElementById("nombreUsuario").textContent = usuarioData?.nombre || "Usuario";

// Cargar contenido inicial
const pantallaInicio = document.getElementById("pantallaInicio");
pantallaInicio.innerHTML = `
  <div class="bienvenidaContainer">
    <img src="../logo.png" alt="Logo del conjunto" class="logoBienvenida" />
    <h2>Bienvenido a tu Panel de Residente</h2>
    <p>${usuarioData?.nombre || "Usuario"}, aquí podrás gestionar tus pagos, reservas, certificados y más 🏠</p>
  </div>
`;


mainTabs.innerHTML = botones
  .map((b) => {
    const extraClass = b.id === "logout" ? "logoutBtn" : "";
    return `<button class="tabBtn ${extraClass}" data-id="${b.id}">${b.nombre}</button>`;
  })
  .join("");

document.querySelectorAll(".tabBtn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;

    if (id !== "logout") {
      // Ocultar pantalla de inicio
      pantallaInicio.classList.add("hidden");
    }
  });
});

// 2. Lógica de clics
    document.querySelectorAll(".tabBtn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            if (id === "logout") {
                // ⬅️ Usar la función importada con el history.replaceState
                logout(); 
                return;
            }

    document.querySelectorAll(".module").forEach((m) => m.classList.add("hidden"));
    const seccion = document.getElementById(id);
    seccion.classList.remove("hidden");

    await cargarModulo(id);
  });
});
