// modules/certificados.js

import { supabase } from "../js/supabaseClient.js";
import { formatearFecha, mostrarMensaje } from "../js/utils.js";


/**
 * Busca si existe un certificado (PDF) del usuario y devuelve su URL pública
 */
async function obtenerCertificado(idUsuario) {
  const nombreArchivo = `paz_y_salvo_${idUsuario}.pdf`;
  const bucket = supabase.storage.from("certificados");

  // Buscar el archivo exacto en el bucket
  const { data: archivos, error: listError } = await bucket.list("", { limit: 200 });
  if (listError) {
    console.error("Error al listar archivos:", listError);
    return null;
  }

  const existe = archivos.find(f => f.name === nombreArchivo);
  if (!existe) {
    console.warn(`No se encontró el archivo ${nombreArchivo}`);
    return null;
  }

  // Obtener URL pública del archivo encontrado
  const { data: urlData } = bucket.getPublicUrl(nombreArchivo);
  return urlData?.publicUrl || null;
}


export async function render(contenedor) {
  const usuarioData = JSON.parse(localStorage.getItem("usuario"));

  if (!usuarioData) {
    mostrarMensaje("Error de sesión. Inicia sesión nuevamente.", "error");
    window.location.href = "../login.html";
    return;
  }

  const { rol, id: usuario_id } = usuarioData;

  // APLICACIÓN DE ESTILO: Clase al título principal
  contenedor.innerHTML = `
    <h2 class="tituloModulo">📜 Certificados</h2>
    <div id="certificados-contenido"></div>
  `;

  if (rol === "administrador") {
    await renderAdmin(contenedor);
  } else {
    await renderUsuario(contenedor, usuario_id);
  }
}


/* =======================================================
   🔹 Vista Residente / Comité
   ======================================================= */
async function renderUsuario(contenedor, usuario_id) {
  const div = contenedor.querySelector("#certificados-contenido");
  
  // APLICACIÓN DE ESTILO: Uso de formContainer, input-group, y btnPrimario
  div.innerHTML = `
    <section class="formContainer" style="margin-bottom: 20px;"> 
      <h3>🏠 Certificado de Paz y Salvo</h3>
      <p style="font-size:0.95rem;">Verifica que todos tus pagos estén al día para obtener tu Paz y Salvo.</p>
      <div class="form-actions" style="justify-content: flex-start;">
        <button id="btnPazYSalvo" class="btnPrimario">Descargar Paz y Salvo</button>
      </div>
    </section>

    <section class="formContainer"> 
      <h3>📄 Solicitar Certificados</h3>
      <div class="input-group">
        <label>Tipo:</label>
        <select id="tipoCert">
          <option value="residencia">Certificado de Residencia</option>
          <option value="autorizacion">Certificado de Autorización</option>
        </select>
      </div>
      <div class="input-group">
        <label>Motivo:</label>
        <textarea id="comentarioCert" placeholder="Motivo o comentario (opcional)"></textarea>
      </div>
      <div class="form-actions" style="justify-content: flex-start;">
        <button id="btnSolicitarCert" class="btnPrimario">Enviar solicitud</button>
      </div>
    </section>

    <section style="margin-top: 30px;">
      <h3 class="tituloModulo" style="font-size: 1.5rem; margin-top:0;">🗂 Mis solicitudes Registradas</h3> 
      <div id="lista-certificados"></div>
    </section>
  `;

  document.getElementById("btnPazYSalvo").onclick = () => verificarPazYSalvo(usuario_id);
  document.getElementById("btnSolicitarCert").onclick = () => {
    const tipo = document.getElementById("tipoCert").value;
    const comentario = document.getElementById("comentarioCert").value;
    solicitarCertificado(usuario_id, tipo, comentario);
  };

  await cargarSolicitudesUsuario(usuario_id);
}


/* =======================================================
   🔹 Vista Administrador
   ======================================================= */
async function renderAdmin(contenedor) {

  const div = contenedor.querySelector("#certificados-contenido");

  div.innerHTML = `

    <h3>📋 Solicitudes de Certificados</h3>

    <table border="1" cellspacing="0" cellpadding="5" width="100%">

      <thead>

        <tr>

          <th>Usuario</th>

          <th>Tipo</th>

          <th>Comentario</th>

          <th>Estado</th>

          <th>Archivo</th>

          <th>Acciones</th>

        </tr>

      </thead>

      <tbody id="tabla-admin-certificados"></tbody>

    </table>

  `;

  await cargarSolicitudesAdmin();

}



/*



/* =======================================================
   🔸 Funciones para Residente / Comité
   ======================================================= */

// ... (verificarPazYSalvo y solicitarCertificado se mantienen igual)
async function verificarPazYSalvo(usuario_id) {
  const { data: pagos, error } = await supabase
    .from("pagos")
    .select("estado")
    .eq("usuario_id", usuario_id);

  if (error) {
    console.error("Error al consultar pagos:", error);
    return mostrarMensaje("Error al consultar los pagos.", "error");
  }

  if (!pagos || pagos.length === 0) {
    return mostrarMensaje("No se encontraron pagos registrados.", "error");
  }

  // Verificar si TODOS los pagos están aprobados
  const todosAprobados = pagos.every(p => p.estado && p.estado.toLowerCase() === "aprobado");

  if (!todosAprobados) {
    return mostrarMensaje(
      "No puedes descargar el paz y salvo. Asegúrate de que todos tus pagos estén aprobados.",
      "error"
    );
  }

  // Si está al día, busca su certificado
  const url = await obtenerCertificado(usuario_id);

  if (!url) {
    return mostrarMensaje("No se encontró tu certificado de paz y salvo en el sistema.", "error");
  }

  // Abrir el certificado propio
  window.open(url, "_blank");
}

async function solicitarCertificado(usuario_id, tipo, comentario) {
  const { error } = await supabase.from("solicitudes_certificados").insert([
    { usuario_id, tipo, comentario, estado: "pendiente" },
  ]);

  if (error) return mostrarMensaje("Error al enviar solicitud.", "error");
  mostrarMensaje("Solicitud enviada correctamente ✅", "success");
  cargarSolicitudesUsuario(usuario_id);
}


async function cargarSolicitudesUsuario(usuario_id) {
  const { data, error } = await supabase
    .from("solicitudes_certificados")
    .select("*")
    .eq("usuario_id", usuario_id)
    .order("fecha_solicitud", { ascending: false });

  if (error) return console.error(error);

  const contenedor = document.getElementById("lista-certificados");
  contenedor.innerHTML = "";

  if (!data || data.length === 0) {
    contenedor.innerHTML = "<p class='solo-lectura'>No tienes solicitudes registradas.</p>";
    return;
  }

  // APLICACIÓN DE ESTILO: Usamos 'anuncio' y las clases de estado
  data.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("anuncio"); // Clase que le da un aspecto de tarjeta/aviso

    // Definir la clase de estado
    let estadoClass = '';
    if (item.estado === 'aprobado') {
      estadoClass = 'status-resuelta'; // Resuelta para 'aprobado'
    } else if (item.estado === 'pendiente') {
      estadoClass = 'status-pendiente';
    } else if (item.estado === 'rechazado') {
      // Para rechazado, solo usamos status-tag (o se podría definir una status-rechazado en el CSS)
      estadoClass = 'status-tag'; 
    }

    let html = `
      <h3>${item.tipo === "residencia" ? "Certificado de Residencia" : "Autorización"}</h3>
      <p>Estado: <span class="status-tag ${estadoClass}">${item.estado.toUpperCase()}</span></p>
      <p>Comentario: ${item.comentario || "—"}</p>
      <small class="fecha">Fecha: ${formatearFecha(item.fecha_solicitud)}</small>
    `;

    if (item.estado === "aprobado" && item.archivo_url) {
      // Uso de btnPrimario y btn small para el enlace de descarga
      html += `<div class="acciones"><a href="${item.archivo_url}" target="_blank" class="btnPrimario btn small" style="text-transform: none;">📄 Descargar certificado</a></div>`;
    } else if (item.estado === "rechazado") {
      html += `<p style="color:#d32f2f; font-weight: 500; margin-top: 10px;">Certificado rechazado, acérquese a administración.</p>`;
    }

    div.innerHTML = html;
    contenedor.appendChild(div);
  });
}


/* =======================================================
   🔸 Funciones para Administrador
   ======================================================= */
async function cargarSolicitudesAdmin() {

  const { data, error } = await supabase

    .from("solicitudes_certificados")

    .select("*, usuarios(nombre)")

    .order("fecha_solicitud", { ascending: false });



  if (error) return console.error(error);



  const tabla = document.getElementById("tabla-admin-certificados");

  tabla.innerHTML = "";



  data.forEach((item) => {

    const fila = document.createElement("tr");



    fila.innerHTML = `

      <td>${item.usuarios?.nombre || "—"}</td>

      <td>${item.tipo}</td>

      <td>${item.comentario || "—"}</td>

      <td>${item.estado}</td>

      <td>

        ${item.archivo_url ? `<a href="${item.archivo_url}" target="_blank">📄 Ver</a>` : "—"}

      </td>

      <td>

        <input type="file" id="file-${item.id}" style="margin-bottom:4px;"><br>

        <button onclick="aprobarCertificado('${item.id}')">✅ Aprobar</button>

        <button onclick="rechazarCertificado('${item.id}')">❌ Rechazar</button>

        <button onclick="subirCertificadoPDF('${item.id}')">⬆️ Subir PDF</button>

      </td>

    `;



    tabla.appendChild(fila);

  });

}



/*


/* =======================================================
   🔹 Acciones del Administrador
   ======================================================= */
// ... (Las funciones de acción se mantienen igual)
window.aprobarCertificado = async (id) => {
  const { error } = await supabase
    .from("solicitudes_certificados")
    .update({ estado: "aprobado", fecha_respuesta: new Date() })
    .eq("id", id);
  if (error) {
    mostrarMensaje("Error al aprobar solicitud.", "error"); // Mensaje de error
    return console.error(error);
  }
  mostrarMensaje("Solicitud aprobada correctamente.", "success"); // ✅ Mensaje de éxito
  cargarSolicitudesAdmin();
};

window.rechazarCertificado = async (id) => {
  const { error } = await supabase
    .from("solicitudes_certificados")
    .update({ estado: "rechazado", fecha_respuesta: new Date() })
    .eq("id", id);
  if (error) {
    mostrarMensaje("Error al rechazar solicitud.", "error"); // Mensaje de error
    return console.error(error);
  }
  mostrarMensaje("Solicitud rechazada correctamente.", "success"); // ✅ Mensaje de éxito
  cargarSolicitudesAdmin();
};

window.subirCertificadoPDF = async (id) => {
  const fileInput = document.getElementById(`file-${id}`);
  const file = fileInput.files[0];
  if (!file) return mostrarMensaje("Selecciona un archivo primero.", "error");

  const filePath = `certificados/${id}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("certificados")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    return mostrarMensaje("Error al subir archivo.", "error");
  }

  const { data: publicUrlData } = supabase.storage
    .from("certificados")
    .getPublicUrl(filePath);

  await supabase
    .from("solicitudes_certificados")
    .update({ archivo_url: publicUrlData.publicUrl })
    .eq("id", id);

  mostrarMensaje("Archivo subido correctamente ✅", "success");
  cargarSolicitudesAdmin();
};