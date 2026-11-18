// Encabezado de cada sección del negocio. La navegación entre secciones está en el encabezado del
// sitio (arriba en compu, barra inferior en el celular): acá va solo el título.
export default function NegocioTabs({ nombre, titulo }) {
  return (
    <div className="negocio-cabecera">
      <p className="eyebrow">{nombre || "Mi negocio"}</p>
      <h1 className="negocio-titulo">{titulo}</h1>
    </div>
  );
}
