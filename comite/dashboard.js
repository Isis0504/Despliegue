import { verificarSesion, logout } from "../js/auth.js";
import { cargarModulo } from "../js/utils.js";

verificarSesion(["comite"]);

const usuario = JSON.parse(localStorage.getItem("usuario"));
document.getElementById("nombreUsuario").textContent = usuario?.nombre || "Comité";

const mainTabs = document.getElementById("mainTabs");

const botones = [
  { id: "modPerfil", nombre: "Mi Perfil" },
  { id: "modPagos", nombre: " Mis Pagos" },
  { id: "modSolicitudes", nombre: "Solicitudes" },
  { id: "modReservas", nombre: "Reservas" },
  { id: "modCertificados", nombre: "Certificados" },
  { id: "modMensajes", nombre: "Comunicaciones" },
  { id: "modSeguimiento", nombre: "Seguimiento" },
  { id: "logout", nombre: "Cerrar Sesión" },
];

const pantallaInicio = document.getElementById("pantallaInicio");
pantallaInicio.innerHTML = `
  <div class="bienvenidaContainer">
    <img src="../logo.png" alt="Logo del conjunto" class="logoBienvenida" />
    <h2>Panel del Comité</h2>
    <p><strong>${usuario?.nombre || "Miembro del Comité"}</strong>, gracias por apoyar la gestión del conjunto.</p>
    <p style="margin-top: 10px; font-size:0.95rem;">
      A quí podrás gestionar tus pagos, reservas, certificados y más. Como miembro del comité, puedes revisar solicitudes y colaborar por el bienestar del conjunto sin extralimitar tus funciones. ¡Gracias por tu compromiso! 🙌
    </p>
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
      logout();
      return;
    }

    document.querySelectorAll(".module").forEach((m) => m.classList.add("hidden"));
    const seccion = document.getElementById(id);
    seccion.classList.remove("hidden");

    await cargarModulo(id);
  });
});