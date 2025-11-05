// modules/mensajes.js
import { supabase } from "../js/supabaseClient.js";
import { mostrarMensaje, filtrarMalasPalabras } from "../js/utils.js";

export async function render(contenedor) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) {
    contenedor.innerHTML = "<p>No hay sesión activa. Vuelve a iniciar sesión.</p>";
    return;
  }
  const rol = usuario.rol;

  contenedor.innerHTML = `
    <div class="mensajes-wrap">
      <section class="card anuncios-card">
        <header><h2>Anuncios</h2></header>
        <div id="listaAnuncios" class="lista-anuncios">Cargando anuncios...</div>
        ${rol === "administrador" ? `<div id="formAnuncio" class="form-area"></div>` : ""}
      </section>

      <section class="card calendario-card">
        <header><h2>Calendario (mes actual)</h2></header>
        <div id="calendario" class="calendario">Cargando calendario...</div>
        ${rol === "administrador" ? `<div id="formActividad" class="form-area"></div>` : ""}
      </section>

      <section class="card foro-card">
        <header><h2>Foro comunitario</h2></header>
        <div id="foroMensajes" class="foro-mensajes">Cargando foro...</div>
        ${rol !== "administrador" ? `<div id="formForo" class="form-area"></div>` : `<p class="solo-lectura">El administrador solo puede ver el foro (solo lectura).</p>`}
      </section>
    </div>
  `;

  // cargar datos
  await cargarAnuncios(rol);
  await cargarCalendario(rol);
  await cargarForo();

  // montar formularios
  if (rol === "administrador") montarFormAnuncio();
  if (rol === "administrador") montarFormActividad();
  if (rol !== "administrador") montarFormForo(usuario.id);
}

/* ---------- ANUNCIOS ---------- */
async function cargarAnuncios(rol) {
  const cont = document.getElementById("listaAnuncios");
  cont.innerHTML = "<p>Cargando anuncios...</p>";

  const { data, error } = await supabase
    .from("anuncios")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error(error);
    cont.innerHTML = "<p>Error cargando anuncios.</p>";
    return;
  }
  if (!data || data.length === 0) {
    cont.innerHTML = "<p>No hay anuncios.</p>";
    return;
  }

  cont.innerHTML = "";
  data.forEach(a => cont.appendChild(crearElementoAnuncio(a, rol)));
}

function crearElementoAnuncio(anuncio, rol) {
  const wrap = document.createElement("div");
  wrap.className = "anuncio";

  const titulo = document.createElement("h3");
  titulo.textContent = anuncio.titulo;
  wrap.appendChild(titulo);

  const contenido = document.createElement("p");
  contenido.textContent = anuncio.contenido;
  wrap.appendChild(contenido);

  const fecha = document.createElement("small");
  fecha.className = "fecha";
  fecha.textContent = new Date(anuncio.fecha).toLocaleDateString("es-CO");
  wrap.appendChild(fecha);

  if (rol === "administrador") {
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    const editar = document.createElement("button");
    editar.className = "btn small";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => editarAnuncio(anuncio));
    const eliminar = document.createElement("button");
    eliminar.className = "btn small ghost";
    eliminar.textContent = "Eliminar";
    eliminar.addEventListener("click", () => eliminarAnuncio(anuncio.id));
    acciones.appendChild(editar);
    acciones.appendChild(eliminar);
    wrap.appendChild(acciones);
  }

  return wrap;
}

function montarFormAnuncio() {
  const cont = document.getElementById("formAnuncio");
  cont.innerHTML = `
    <input id="tituloAnuncio" placeholder="Título" />
    <textarea id="contenidoAnuncio" placeholder="Contenido"></textarea>
    <div class="form-actions">
      <button id="btnPublicarAnuncio" class="btn">Publicar</button>
      <button id="btnLimpiarAnuncio" class="btn ghost">Limpiar</button>
    </div>
  `;
  document.getElementById("btnPublicarAnuncio").addEventListener("click", publicarAnuncio);
  document.getElementById("btnLimpiarAnuncio").addEventListener("click", () => {
    document.getElementById("tituloAnuncio").value = "";
    document.getElementById("contenidoAnuncio").value = "";
  });
}

async function publicarAnuncio() {
  const titulo = document.getElementById("tituloAnuncio").value.trim();
  const contenido = document.getElementById("contenidoAnuncio").value.trim();
  if (!titulo || !contenido) return mostrarMensaje("Completa título y contenido", "error");

  const { error } = await supabase.from("anuncios").insert([{ titulo, contenido }]);
  if (error) { console.error(error); return mostrarMensaje("No se pudo publicar", "error"); }
  mostrarMensaje("Anuncio publicado", "success");
  document.getElementById("tituloAnuncio").value = "";
  document.getElementById("contenidoAnuncio").value = "";
  await cargarAnuncios("administrador");
}

async function editarAnuncio(anuncio) {
  const nuevoTitulo = prompt("Editar título:", anuncio.titulo);
  if (nuevoTitulo === null) return;
  const nuevoContenido = prompt("Editar contenido:", anuncio.contenido);
  if (nuevoContenido === null) return;

  const { error } = await supabase.from("anuncios").update({ titulo: nuevoTitulo, contenido: nuevoContenido }).eq("id", anuncio.id);
  if (error) { console.error(error); return mostrarMensaje("No se pudo actualizar", "error"); }
  mostrarMensaje("Anuncio actualizado", "success");
  await cargarAnuncios("administrador");
}

async function eliminarAnuncio(id) {
  if (!confirm("¿Eliminar anuncio?")) return;
  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) { console.error(error); return mostrarMensaje("No se pudo eliminar", "error"); }
  mostrarMensaje("Anuncio eliminado", "success");
  await cargarAnuncios("administrador");
}

/* ---------- CALENDARIO / ACTIVIDADES ---------- */
async function cargarCalendario(rol) {
  const cont = document.getElementById("calendario");
  cont.innerHTML = "<p>Cargando calendario...</p>";

  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const primerDia = new Date(year, month, 1).toISOString().slice(0,10);
  const ultimoDia = new Date(year, month + 1, 0).toISOString().slice(0,10);

  const { data: actividades = [], error } = await supabase
    .from("actividades")
    .select("*")
    .gte("fecha", primerDia)
    .lte("fecha", ultimoDia)
    .order("fecha", { ascending: true });

  if (error) {
    console.error(error);
    cont.innerHTML = "<p>Error cargando actividades.</p>";
    return;
  }

  // grid básico
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const grid = document.createElement("div");
  grid.className = "grid-calendario";

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const actividad = actividades.find(a => a.fecha === fechaStr);

    const celda = document.createElement("div");
    celda.className = "celda";
    if (actividad) celda.classList.add("ocupado");

    const n = document.createElement("div");
    n.className = "num";
    n.textContent = d;
    celda.appendChild(n);

    if (actividad) {
      const t = document.createElement("div");
      t.className = "act-titulo";
      t.textContent = actividad.titulo;
      celda.appendChild(t);

      if (rol === "administrador") {
        const acciones = document.createElement("div");
        acciones.className = "acciones-small";
        const editar = document.createElement("button");
        editar.className = "btn small";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => editarActividad(actividad));
        const eliminar = document.createElement("button");
        eliminar.className = "btn small ghost";
        eliminar.textContent = "Eliminar";
        eliminar.addEventListener("click", () => eliminarActividad(actividad.id));
        acciones.appendChild(editar);
        acciones.appendChild(eliminar);
        celda.appendChild(acciones);
      }
    }

    grid.appendChild(celda);
  }

  cont.innerHTML = "";
  cont.appendChild(grid);
}

function montarFormActividad() {
  const cont = document.getElementById("formActividad");
  cont.innerHTML = `
    <input id="tituloActividad" placeholder="Título actividad" />
    <input id="fechaActividad" type="date" />
    <div class="form-actions">
      <button id="btnAgregarActividad" class="btnPrimario">Agregar</button>
      <button id="btnLimpiarActividad" class="btn ghost">Limpiar</button>
    </div>
  `;
  document.getElementById("btnAgregarActividad").addEventListener("click", agregarActividad);
  document.getElementById("btnLimpiarActividad").addEventListener("click", () => {
    document.getElementById("tituloActividad").value = "";
    document.getElementById("fechaActividad").value = "";
  });
}

async function agregarActividad() {
  const titulo = document.getElementById("tituloActividad").value.trim();
  const fecha = document.getElementById("fechaActividad").value;
  if (!titulo || !fecha) return mostrarMensaje("Completa título y fecha", "error");

  const { error } = await supabase.from("actividades").insert([{ titulo, fecha }]);
  if (error) { console.error(error); return mostrarMensaje("No se pudo agregar", "error"); }
  mostrarMensaje("Actividad agregada", "success");
  document.getElementById("tituloActividad").value = "";
  document.getElementById("fechaActividad").value = "";
  await cargarCalendario("administrador");
}

function abrirModalEdicionActividad(actividad) {
    // Si ya existe, lo eliminamos
    const existingModal = document.getElementById("modalActividad");
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="modalActividad" class="modal-backdrop" style="display:flex; justify-content:center; align-items:center; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 1000;">
            <div class="modal-content card" style="background:white; padding:20px; border-radius:8px; width: 350px;">
                <h3 style="margin-top:0;">Editar Título y Fecha</h3>
                <div class="input-group">
                    <label>Título:</label>
                    <input type="text" id="modalTituloActividad" value="${actividad.titulo}" />
                </div>
                <div class="input-group" style="margin-top:10px;">
                    <label>Fecha:</label>
                    <input type="date" id="modalFechaActividad" value="${actividad.fecha}" />
                </div>
                <div class="form-actions" style="margin-top: 20px; display:flex; justify-content: flex-end; gap: 10px;">
                    <button id="btnAceptarModal" class="btnPrimario">Aceptar</button>
                    <button id="btnCancelarModal" class="btn ghost">Cancelar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById("modalActividad");

    // Lógica para cerrar el modal
    const cerrarModal = () => modal.remove();
    document.getElementById("btnCancelarModal").addEventListener("click", cerrarModal);
    
    // Lógica para guardar la edición
    document.getElementById("btnAceptarModal").addEventListener("click", () => {
        const nuevoTitulo = document.getElementById("modalTituloActividad").value.trim();
        const nuevaFecha = document.getElementById("modalFechaActividad").value;

        if (!nuevoTitulo || !nuevaFecha) {
            return mostrarMensaje("Completa el título y la fecha.", "error");
        }
        
        // Llamar a la función de guardado
        guardarEdicionActividad(actividad.id, nuevoTitulo, nuevaFecha);
        cerrarModal();
    });
}

// Función auxiliar para guardar (similar a la original, pero toma los datos del modal)
async function guardarEdicionActividad(id, titulo, fecha) {
    const { error } = await supabase.from("actividades")
        .update({ titulo: titulo, fecha: fecha })
        .eq("id", id);

    if (error) { 
        console.error("Error al editar actividad:", error); 
        return mostrarMensaje("No se pudo actualizar la actividad.", "error"); 
    }
    
    mostrarMensaje("Actividad actualizada ✅", "success");
    await cargarCalendario("administrador");
}

async function editarActividad(actividad) {
  // 1. Editar Título
  abrirModalEdicionActividad(actividad);
  if (nuevoTitulo === null) return; // Canceló
  nuevoTitulo = nuevoTitulo.trim();
  if (nuevoTitulo === "") {
    mostrarMensaje("El título no puede estar vacío.", "error");
    return;
  }

  // 2. Editar Fecha (Se mantiene el prompt simple)
  let nuevaFecha = prompt("Editar fecha (Formato: YYYY-MM-DD):", actividad.fecha);
  if (nuevaFecha === null) return; // Canceló
  nuevaFecha = nuevaFecha.trim();
  if (nuevaFecha === "") {
    mostrarMensaje("La fecha no puede estar vacía.", "error");
    return;
  }

  // 3. Actualizar
  const { error } = await supabase.from("actividades")
    .update({ titulo: nuevoTitulo, fecha: nuevaFecha })
    .eq("id", actividad.id);

  // 4. Manejo de error y mensaje de éxito
  if (error) {
    console.error("Error al editar actividad:", error);
    return mostrarMensaje("No se pudo actualizar la actividad. Revisa el formato de fecha (YYYY-MM-DD).", "error");
  }
  
  mostrarMensaje("Actividad actualizada ✅", "success");
  await cargarCalendario("administrador");
}

async function eliminarActividad(id) {
  if (!confirm("¿Eliminar actividad?")) return;
  const { error } = await supabase.from("actividades").delete().eq("id", id);
  if (error) { console.error(error); return mostrarMensaje("No se pudo eliminar", "error"); }
  mostrarMensaje("Actividad eliminada", "success");
  await cargarCalendario("administrador");
}

/* ---------- FORO ---------- */
async function cargarForo() {
  const cont = document.getElementById("foroMensajes");
  cont.innerHTML = "<p>Cargando foro...</p>";

  const { data, error } = await supabase
    .from("foro_mensajes")
    .select("id, mensaje, fecha, usuarios (nombre, casa_numero)")
    .order("fecha", { ascending: false });

  if (error) {
    console.error(error);
    cont.innerHTML = "<p>Error cargando foro.</p>";
    return;
  }

  if (!data || data.length === 0) {
    cont.innerHTML = "<p>No hay mensajes.</p>";
    return;
  }

  cont.innerHTML = "";
  data.forEach(m => {
    const el = document.createElement("div");
    el.className = "foro-item";
    const autor = document.createElement("strong");
    autor.textContent = `${m.usuarios?.casa_numero || "—"} - ${m.usuarios?.nombre || "Usuario"}`;
    el.appendChild(autor);
    const txt = document.createElement("p");
    txt.textContent = m.mensaje;
    el.appendChild(txt);
    const fecha = document.createElement("small");
    fecha.textContent = new Date(m.fecha).toLocaleString("es-CO");
    el.appendChild(fecha);
    cont.appendChild(el);
  });
}

function montarFormForo(usuario_id) {
    const cont = document.getElementById("formForo");
    cont.innerHTML = `
        <textarea id="mensajeForo" placeholder="Escribe un mensaje..." rows="3"></textarea>
        
        <small class="disclaimer">
            Al publicar, confirmas que tienes los derechos de autor sobre el contenido o es de dominio público, y aceptas que el mensaje será **filtrado automáticamente** para evitar lenguaje inapropiado.
        </small>
        
        <div class="form-actions">
            <button id="btnEnviarForo" class="btn">Enviar</button>
            <button id="btnLimpiarForo" class="btn ghost">Limpiar</button>
        </div>
    `;
    document.getElementById("btnEnviarForo").addEventListener("click", async () => {
        const mensajeInput = document.getElementById("mensajeForo");
        let mensaje = mensajeInput.value.trim(); // Obtener mensaje original

        if (!mensaje) return mostrarMensaje("Escribe algo antes de enviar", "error");

        // 2. CORRECCIÓN: Aplicar el filtro
        const mensajeFiltrado = filtrarMalasPalabras(mensaje);

        // Insertar el mensaje filtrado
        const { error } = await supabase.from("foro_mensajes").insert([{ 
            usuario_id, 
            mensaje: mensajeFiltrado // Usamos el valor censurado
        }]);
        
        if (error) { console.error(error); return mostrarMensaje("No se pudo enviar", "error"); }
        
        // Notificación de éxito y, opcionalmente, de filtro
        if (mensaje !== mensajeFiltrado) {
             mostrarMensaje("Mensaje publicado. Se aplicó el filtro de palabras.", "alerta");
        } else {
             mostrarMensaje("Mensaje publicado", "success");
        }
        
        mensajeInput.value = "";
        await cargarForo();
    });
    document.getElementById("btnLimpiarForo").addEventListener("click", () => {
        document.getElementById("mensajeForo").value = "";
    });
}
