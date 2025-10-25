import { supabase } from "../js/supabaseClient.js";

export function render(contenedor) {
  // Aseguramos que el contenedor tenga el ID correcto (aunque ya lo hace el dashboard)
  contenedor.id = "modSolicitudes";
  cargarSolicitudes();
}

export async function cargarSolicitudes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id;

  if (!userId) {
    // Usamos mostrarMensaje si está disponible, sino alert
    const modUtils = await import("../js/utils.js");
    if (modUtils.mostrarMensaje) {
        modUtils.mostrarMensaje("Error: No se encontró el usuario en sesión.", "error");
    } else {
        alert("Error: No se encontró el usuario en sesión.");
    }
    return;
  }

  const contenedor = document.getElementById("modSolicitudes");
  contenedor.innerHTML = `
    <h2 class="tituloModulo">Mis Solicitudes</h2> <form id="nuevaSolicitudForm" class="formContainer"> 
      <h3 style="color:var(--verde-principal); margin-bottom:15px;">Enviar nueva Solicitud</h3>
      
      <div class="input-group">
        <label for="tituloSolicitud">Título</label>
        <input type="text" id="tituloSolicitud" placeholder="Breve título de la solicitud" required />
      </div>
      
      <div class="input-group">
        <label for="descripcionSolicitud">Descripción</label>
        <textarea id="descripcionSolicitud" placeholder="Detalles de la solicitud..." required></textarea>
      </div>

      <div class="input-group">
        <label for="archivoEvidencia">Evidencia (opcional):</label>
        <input type="file" id="archivoEvidencia" accept="image/*,application/pdf" />
      </div>

      <div class="form-actions">
          <button type="submit" class="btnPrimario">Enviar Solicitud</button>
      </div>
    </form>

    <h3 class="tituloModulo" style="margin-top:40px; font-size:1.3rem;">Solicitudes Registradas</h3>
    <div id="listaSolicitudes"></div>
  `;

  // ... (Listeners de submit se mantienen igual) ...
  const form = document.getElementById("nuevaSolicitudForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // ... (Lógica de subir archivo y registrar se mantiene) ...
    
    // Simplificamos las alertas para que usen mostrarMensaje si existe
    const titulo = document.getElementById("tituloSolicitud").value.trim();
    const descripcion = document.getElementById("descripcionSolicitud").value.trim();
    const archivo = document.getElementById("archivoEvidencia").files[0];

    const modUtils = await import("../js/utils.js"); // Importamos utils para mostrarMensaje
    const funcMostrarMensaje = modUtils.mostrarMensaje || alert;

    if (!titulo || !descripcion) {
      funcMostrarMensaje("Por favor completa todos los campos obligatorios.", "error");
      return;
    }

    let evidenciaUrl = null;

    if (archivo) {
      // ... (Lógica de subir archivo se mantiene) ...
      const nombreArchivo = `${userId}_${Date.now()}_${archivo.name}`;
      const { error: uploadError } = await supabase.storage
         .from("evidencias")
         .upload(nombreArchivo, archivo);

      if (uploadError) {
        funcMostrarMensaje("Error al subir la evidencia: " + uploadError.message, "error");
        console.error(uploadError);
        return; // Detenemos la función si hay error de subida
      } else {
        const { data: publicUrl } = supabase.storage
          .from("evidencias")
          .getPublicUrl(nombreArchivo);
        evidenciaUrl = publicUrl.publicUrl;
      }
    }

    const { error } = await supabase.from("solicitudes").insert([
      {
        usuario_id: userId,
        titulo,
        descripcion,
        evidencia_url: evidenciaUrl,
        estado: "pendiente",
        fecha: new Date().toISOString(),
      },
    ]);

    if (error) {
      funcMostrarMensaje("Error al registrar la solicitud: " + error.message, "error");
      console.error(error);
    } else {
      funcMostrarMensaje("Solicitud registrada correctamente.", "success");
      form.reset();
      cargarListaSolicitudes();
    }
  });

  cargarListaSolicitudes();
}

async function cargarListaSolicitudes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const userId = usuario?.id;

  const { data, error } = await supabase
    .from("solicitudes")
    .select(`
      id,
      titulo,
      descripcion,
      evidencia_url,
      estado,
      fecha,
      seguimiento (
        id,
        comentario,
        fecha,
        usuario_id
      )
    `)
    .eq("usuario_id", userId)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error cargando solicitudes:", error);
    return;
  }

  const lista = document.getElementById("listaSolicitudes");
  if (!data || data.length === 0) {
    lista.innerHTML = "<p>No tienes solicitudes registradas.</p>";
    return;
  }

  // Mapa de estados a clases CSS
  const estadoClase = (estado) => {
      switch (estado) {
          case 'aprobado':
          case 'resuelta':
              return 'status-tag status-aprobado';
          case 'en proceso':
              return 'status-tag status-en-proceso';
          default:
              return 'status-tag status-pendiente';
      }
  };

  lista.innerHTML = `
    <table class="tablaEstilo"> 
      <thead>
        <tr>
          <th>Título</th>
          <th style="width:30%;">Descripción</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th>Evidencia</th>
          <th style="width:25%;">Respuesta del Comité/Admin</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (s) => `
            <tr>
              <td>${s.titulo}</td>
              <td>${s.descripcion}</td>
              <td>
                <span class="${estadoClase(s.estado)}">${s.estado}</span>
              </td>
              <td>${new Date(s.fecha).toLocaleDateString()}</td>
              <td>
                ${
                  s.evidencia_url
                    ? `<a href="${s.evidencia_url}" target="_blank" class="btnSecundario btn-small">Ver archivo</a>` // Botón secundario
                    : "—"
                }
              </td>
              <td style="font-size:0.9em;">
                ${
                  s.seguimiento?.length
                    ? s.seguimiento
                        .map(
                          (c) =>
                            `<p style="margin-bottom:5px;">
                                <strong>${new Date(
                                  c.fecha
                                ).toLocaleDateString()}:</strong> ${c.comentario}
                             </p>`
                        )
                        .join("")
                    : "<em class='solo-lectura'>Sin respuesta</em>" // Clase de texto tenue
                }
              </td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}