// Configuración de Supabase
const SUPABASE_URL = 'https://qhgnroypzmclwelxuyqd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NHTTShjh_nhl-Fl4BZ5fbw_cfpMv719';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();
  cargarEquipos();
  cargarServicios();
});


// . CLIENTES
async function cargarClientes() {
  const { data, error } = await _supabase.from('clientes').select('*').order('id', { ascending: true });
  if (error) return console.error('Error al cargar clientes:', error);

  const tbody = document.getElementById('tabla-clientes');
  const select = document.getElementById('eq-clienteid');
  if (!tbody || !select) return;
  
  tbody.innerHTML = '';
  select.innerHTML = '<option value="">Seleccionar Cliente *</option>';

  data.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.nombre}</td>
        <td>${c.apellido}</td>
        <td>${c.telefono}</td>
        <td>${c.email || '-'}</td>
        <td>${c.direccion || '-'}</td>
        <td>${c.dni || '-'}</td>
      </tr>
    `;
    select.innerHTML += `<option value="${c.id}">${c.nombre} ${c.apellido} (ID: ${c.id})</option>`;
  });
}

document.getElementById('form-cliente')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCliente = {
    nombre: document.getElementById('cli-nombre').value,
    apellido: document.getElementById('cli-apellido').value,
    telefono: document.getElementById('cli-telefono').value,
    dni: document.getElementById('cli-dni').value,
    email: document.getElementById('cli-email').value || null,
    direccion: document.getElementById('cli-direccion').value || null
  };

  const { error } = await _supabase.from('clientes').insert([nuevoCliente]);
  if (error) return alert('Error al guardar cliente: ' + error.message);

  document.getElementById('form-cliente').reset();
  cargarClientes();
});


// 2. EQUIPOS y COMPROBANTE DE INGRESO
async function cargarEquipos() {
  const { data, error } = await _supabase.from('equipos').select('*').order('id', { ascending: true });
  if (error) return console.error('Error al cargar equipos:', error);

  const tbody = document.getElementById('tabla-equipos');
  const select = document.getElementById('srv-equipoid');
  if (!tbody || !select) return;

  tbody.innerHTML = '';
  select.innerHTML = '<option value="">Seleccionar Equipo *</option>';

  data.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e.id}</td>
        <td>${e.clienteid}</td>
        <td>${e.tipo}</td>
        <td>${e.marca}</td>
        <td>${e.modelo}</td>
        <td>${e.nro_serie || '-'}</td>
        <td>
          <button onclick="emitirComprobanteIngresoPorEquipo(Number(${e.id}))" style="background:#0d9488; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" title="Comprobante de Ingreso">📄 Ingreso</button>
        </td>
      </tr>
    `;
    select.innerHTML += `<option value="${e.id}">${e.tipo} ${e.marca} ${e.modelo} (ID: ${e.id})</option>`;
  });
}

document.getElementById('form-equipo')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoEquipo = {
    clienteid: parseInt(document.getElementById('eq-clienteid').value),
    tipo: document.getElementById('eq-tipo').value,
    marca: document.getElementById('eq-marca').value,
    modelo: document.getElementById('eq-modelo').value,
    nro_serie: document.getElementById('eq-nro-serie').value || null,
    accesorios: document.getElementById('eq-accesorios').value || null,
    otros_detalles: document.getElementById('eq-otros-detalles').value || null
  };

  const { data, error } = await _supabase.from('equipos').insert([nuevoEquipo]).select();
  if (error) return alert('Error al guardar equipo: ' + error.message);

  document.getElementById('form-equipo').reset();
  cargarEquipos();

  if (data && data.length > 0 && data[0].id) {
    const idGenerado = Number(data[0].id);
    if (confirm("¡Equipo registrado con éxito! ¿Desea emitir el Comprobante de Ingreso en PDF?")) {
      emitirComprobanteIngresoPorEquipo(idGenerado);
    }
  } else {
    const { data: ultimoEquipo } = await _supabase.from('equipos').select('id').order('id', { ascending: false }).limit(1);
    if (ultimoEquipo && ultimoEquipo.length > 0) {
      const idGenerado = Number(ultimoEquipo[0].id);
      if (confirm("¡Equipo registrado con éxito! ¿Desea emitir el Comprobante de Ingreso en PDF?")) {
        emitirComprobanteIngresoPorEquipo(idGenerado);
      }
    }
  }
});


//SERVICIOS y TABLA COMPLETA
async function cargarServicios() {
  const { data, error } = await _supabase.from('servicios').select('*').order('id', { ascending: true });
  if (error) return console.error('Error al cargar servicios:', error);

  const tbody = document.getElementById('tabla-servicios');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.nro_servicio || '-'}</td>
        <td>${s.equipoid}</td>
        <td>${s.fechaingreso || '-'}</td>
        <td>${s.estado || '-'}</td>
        <td>${s.costo ? '$' + parseFloat(s.costo).toFixed(2) : 'A presupuestar'}</td>
        <td>${s.diagnostico || s.estadoinicial || '-'}</td>
        <td>
          <button onclick="emitirEntregaEquipo(Number(${s.id}))" style="background:#4f46e5; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" title="Acta de Entrega">📦 Entrega</button>
        </td>
      </tr>
    `;
  });
}

document.getElementById('form-servicio')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const costoInput = document.getElementById('srv-costo').value;

  const nuevoServicio = {
    equipoid: parseInt(document.getElementById('srv-equipoid').value),
    fechaingreso: document.getElementById('srv-fecha').value,
    estado: document.getElementById('srv-estado').value,
    estadoinicial: document.getElementById('srv-estado').value,
    costo: costoInput ? parseFloat(costoInput) : null,
    diagnostico: document.getElementById('srv-descripcion').value,
    reparacion: "Pendiente de reparación",
    nro_servicio: 'SRV-' + Math.floor(1000 + Math.random() * 9000)
  };

  const { data, error } = await _supabase.from('servicios').insert([nuevoServicio]).select();
  if (error) return alert('Error al guardar servicio: ' + error.message);

  document.getElementById('form-servicio').reset();
  cargarServicios();

  if (data && data.length > 0 && data[0].id) {
    const idServicioGenerado = Number(data[0].id);
    if (confirm("¡Servicio registrado con éxito! ¿Desea emitir el Acta de Entrega en PDF?")) {
      emitirEntregaEquipo(idServicioGenerado);
    }
  } else {
    const { data: ultimoServicio } = await _supabase.from('servicios').select('id').order('id', { ascending: false }).limit(1);
    if (ultimoServicio && ultimoServicio.length > 0) {
      const idServicioGenerado = Number(ultimoServicio[0].id);
      if (confirm("¡Servicio registrado con éxito! ¿Desea emitir el Acta de Entrega en PDF?")) {
        emitirEntregaEquipo(idServicioGenerado);
      }
    }
  }
});

// GENERADORES DE PDF

async function emitirComprobanteIngresoPorEquipo(equipoId) {
  const idNumerico = parseInt(equipoId);
  if (!idNumerico) return alert("ID de equipo inválido.");

  const { data: eqData, error } = await _supabase.from('equipos').select('*').eq('id', idNumerico).single();
  if (error || !eqData) {
    console.error("Error buscando equipo:", error);
    return alert("No se encontró el equipo en la base de datos.");
  }

  let cliData = null;
  if (eqData.clienteid) {
    const { data: cliRes } = await _supabase.from('clientes').select('*').eq('id', eqData.clienteid).single();
    cliData = cliRes;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const colorAzul = [33, 48, 73];
  const colorGris = [100, 116, 139];
  const fechaHoy = new Date().toLocaleDateString();

  doc.setFillColor(...colorAzul);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("EPET N° 1 - COMPROBANTE DE INGRESO", 15, 12);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Escuela Provincial de Educación Técnica N° 1 | Av. Juan Domingo Perón N° 1117 - C.P. 5300", 15, 16);
  doc.text("Teléfono: (0380) 442-8885 | Email: epet1larioja@gmail.com", 15, 21);

  doc.text(`Fecha Ingreso: ${fechaHoy}`, 145, 17);

  let yPos = 34;
  doc.setDrawColor(...colorGris);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, 180, 32, 2, 2, "FD");

  doc.setTextColor(...colorAzul);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE Y EQUIPO", 20, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);

  doc.text(`Cliente: ${cliData ? cliData.nombre + ' ' + cliData.apellido : 'N/A'}`, 20, yPos + 14);
  doc.text(`Teléfono: ${cliData ? cliData.telefono : '-'}`, 110, yPos + 14);
  doc.text(`Equipo: ${eqData.tipo} - ${eqData.marca} ${eqData.modelo}`, 20, yPos + 22);
  doc.text(`N° Serie: ${eqData.nro_serie || '-'}`, 110, yPos + 22);

  yPos += 38;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, 180, 32, 2, 2, "FD");

  doc.setTextColor(...colorAzul);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES INICIALES", 20, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);

  doc.text(`Accesorios: ${eqData.accesorios || 'Ninguno'}`, 20, yPos + 14);
  doc.text(`Observaciones: ${eqData.otros_detalles || '-'}`, 20, yPos + 22);

  yPos += 38;
  doc.autoTable({
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Concepto de Recepción', 'Estado']],
    body: [['Recepción de equipo en taller', 'Ingresado correctamente']],
    headStyles: { fillColor: colorAzul, textColor: [255, 255, 255], fontStyle: 'bold' },
    theme: 'grid'
  });

  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Nota: Este comprobante es indispensable para retirar el equipo del establecimiento técnico.", 15, finalY);

  const firmaY = finalY + 25;
  doc.setLineWidth(0.5);
  doc.setDrawColor(150);
  doc.line(25, firmaY, 85, firmaY);
  doc.line(125, firmaY, 185, firmaY);

  doc.text("Firma y Sello Institucional", 40, firmaY + 5);
  doc.text("Firma del Cliente", 140, firmaY + 5);

  doc.save(`Comprobante_Ingreso_Equipo_${eqData.id}.pdf`);
}

async function emitirEntregaEquipo(servicioId) {
  const idNumerico = parseInt(servicioId);
  if (!idNumerico) return alert("ID de servicio inválido.");

  const { data: servData, error } = await _supabase.from('servicios').select('*').eq('id', idNumerico).single();
  if (error || !servData) {
    console.error("Error buscando servicio:", error);
    return alert("No se encontró el servicio en la base de datos.");
  }

  const { data: eqData } = await _supabase.from('equipos').select('*').eq('id', servData.equipoid).single();
  
  let cliData = null;
  if (eqData) {
    const { data: cliRes } = await _supabase.from('clientes').select('*').eq('id', eqData.clienteid).single();
    cliData = cliRes;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const colorAzul = [33, 48, 73];
  const colorGris = [100, 116, 139];
  let fechaServicio = new Date().toLocaleDateString();
  if (servData.fechaingreso) {
    const partes = servData.fechaingreso.split('-'); 
    if (partes.length === 3) {
      fechaServicio = `${partes[2]}/${partes[1]}/${partes[0]}`; 
    }
  }
  doc.setFillColor(...colorAzul);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("EPET N° 1 - ACTA DE ENTREGA DE EQUIPO", 15, 10);

  // Datos institucionales y contacto
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Escuela Provincial de Educación Técnica N° 1 | Av. Juan Domingo Perón N° 1117 - C.P. 5300", 15, 16);
  doc.text("Teléfono: (0380) 442-8885 | Email: epet1larioja@gmail.com", 15, 21);

  doc.text(`N° Servicio: ${servData.nro_servicio || '#' + servData.id}`, 145, 11);
 doc.text(`Fecha Retiro: ${fechaServicio}`, 145, 17);

  let yPos = 34;
  doc.setDrawColor(...colorGris);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, 180, 32, 2, 2, "FD");

  doc.setTextColor(...colorAzul);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL RETIRO", 20, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);

  doc.text(`Cliente: ${cliData ? cliData.nombre + ' ' + cliData.apellido : 'N/A'}`, 20, yPos + 14);
  doc.text(`Teléfono: ${cliData ? cliData.telefono : '-'}`, 110, yPos + 14);
  doc.text(`Equipo Entregado: ${eqData ? eqData.tipo + ' - ' + eqData.marca + ' ' + eqData.modelo : '-'}`, 20, yPos + 22);
  doc.text(`N° Serie: ${eqData && eqData.nro_serie ? eqData.nro_serie : '-'}`, 110, yPos + 22);

  yPos += 38;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, 180, 35, 2, 2, "FD");

  doc.setTextColor(...colorAzul);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONFORMIDAD DE ENTREGA", 20, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);
  
  const textoConformidad = "Por medio de la presente se certifica que el equipo detallado ha sido devuelto a su propietario en condiciones satisfactorias de servicio y conformidad técnica.";
  doc.text(doc.splitTextToSize(textoConformidad, 170), 20, yPos + 15);

  yPos += 41;
  doc.autoTable({
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Detalle del Servicio Finalizado', 'Total Abonado']],
    body: [['Servicio técnico completado y reparado', servData.costo ? `$${parseFloat(servData.costo).toFixed(2)}` : '$0.00']],
    headStyles: { fillColor: colorAzul, textColor: [255, 255, 255], fontStyle: 'bold' },
    theme: 'grid'
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.setLineWidth(0.5);
  doc.setDrawColor(150);
  doc.line(25, finalY, 85, finalY);
  doc.line(125, finalY, 185, finalY);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Firma del Técnico Responsable", 35, finalY + 5);
  doc.text("Firma de Conformidad del Cliente", 130, finalY + 5);

  doc.save(`Acta_Entrega_${servData.nro_servicio || servData.id}.pdf`);
}