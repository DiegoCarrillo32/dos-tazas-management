export type Language = "en" | "es";

export const dictionaries = {
  en: {
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    update: "Update",
    loading: "Loading...",

    // Sidebar
    nav_dashboard: "Dashboard",
    nav_pos: "Point of Sale",
    nav_inventory: "Inventory",
    nav_history: "Order History",
    nav_customers: "Customers",
    nav_analytics: "Analytics",
    nav_settings: "Settings",
    sidebar_order_management: "Order Management",
    sidebar_dashboard: "Dashboard",
    sidebar_logout: "Log out",

    // Orders
    orders_title: "Orders",
    orders_subtitle: "Manage pending, roasted, and delivered orders.",
    orders_new: "New Order",
    orders_create_new: "Create New Order",
    orders_pending: "Pending",
    orders_roasted: "Roasted",
    orders_delivered: "Delivered",
    orders_no_stage_orders: "No orders in this stage.",
    order_unknown_customer: "Unknown Customer",
    order_unpaid: "Unpaid",
    order_paid: "Paid",
    order_total: "Total",
    order_close: "Close",

    // History
    history_title: "Order History",
    history_subtitle: "View all completed (delivered and paid) orders.",
    history_no_orders: "No Completed Orders Yet",
    history_no_orders_desc:
      "Orders will appear here once they are marked as delivered and paid.",

    // Inventory
    inventory_title: "Inventory",
    inventory_subtitle: "Manage your raw materials and stock levels.",
    inventory_add: "Add Stock",
    inventory_add_title: "Add Inventory Item",
    inventory_directory: "Stock Directory",
    inventory_tracking: "You are tracking {count} inventory items.",
    inventory_col_item: "Item / Origin",
    inventory_col_category: "Category",
    inventory_col_raw: "Raw Stock",
    inventory_col_yield: "Roasted Yield (Est. -{loss}%)",
    inventory_col_cost: "Cost / kg",
    inventory_no_found: "No inventory found",
    inventory_no_found_desc:
      "Click 'Add Stock' to register your first batch of coffee.",
    inv_form_edit: "Edit Inventory Item",
    inv_form_add: "Add Inventory Item",
    inv_form_name: "Item Name / Origin",
    inv_form_name_placeholder: "e.g. Green Beans - Finca El Paraiso",
    inv_form_category: "Category",
    inv_form_select_cat: "Select category",
    inv_form_cat_green: "Green Coffee",
    inv_form_cat_merch: "Merchandise",
    inv_form_cat_equipment: "Equipment",
    inv_form_cost: "Cost per kg ($)",
    inv_form_raw_stock: "Raw Stock (grams)",
    inv_form_quantity: "Quantity",
    inv_form_yield_est: "Estimated Roasted Yield (-{loss}% loss):",
    inv_form_notes: "Notes (Origin details, etc.)",
    inv_form_notes_placeholder: "e.g. Washed process, harvest 2026",
    inv_form_save: "Save Item",

    // Order Form
    order_form_edit: "Edit Order",
    order_form_new: "New Order",
    order_form_customer: "Customer",
    order_form_add_customer: "+ Add New Customer",
    order_form_cancel_customer: "Cancel New Customer",
    order_form_select_customer: "Select customer",
    order_form_no_customers:
      "No customers yet. Click '+ Add New Customer' to create one.",
    order_form_coffee_bean: "Coffee Bean (Inventory)",
    order_form_optional: "(Optional)",
    order_form_select_bean: "Select coffee bean to deduct from inventory",
    order_form_none_manual: "None (Manual Entry)",
    order_form_raw_stock: "kg raw stock",
    order_form_deduct_info:
      "If selected, the amount of grams will be automatically deducted from your raw stock (including {loss}% roasting loss) upon creation.",
    order_form_inventory_warning:
      "Inventory source cannot be changed after order creation.",
    order_form_preparation: "Preparation",
    order_form_select_method: "Select method",
    order_form_roast_level: "Roast Level",
    order_form_select_roast: "Select roast",
    order_form_amount: "Amount (grams)",
    order_form_total_price: "Total Price ($)",
    order_form_origin_notes: "Origin Notes (Farmer Recognition)",
    order_form_origin_notes_placeholder:
      "e.g. Finca El Paraiso, Diego Bermudez",
    order_form_update: "Update Order",
    order_form_create: "Create Order",

    // Customers
    customers_title: "Customers",
    customers_subtitle: "Manage your customer database and contacts.",
    customers_new: "New Customer",
    customers_new_title: "Create New Customer",
    customers_directory: "Customer Directory",
    customers_tracking: "You have {count} total customers.",
    customers_col_name: "Name",
    customers_col_phone: "Phone",
    customers_col_address: "Address",
    customers_col_added: "Added On",
    customers_col_last_purchase: "Last Purchase",
    customers_col_actions: "Actions",
    customers_no_found: "No customers found",
    customers_no_found_desc: "Click 'New Customer' to add your first customer.",
    customers_not_provided: "Not provided",
    customers_never: "Never",

    // Customer Form
    cust_form_edit: "Edit Customer",
    cust_form_add: "Add Customer",
    cust_form_full_name: "Full Name",
    cust_form_phone: "Phone Number",
    cust_form_address: "Address",
    cust_form_save: "Save Customer",

    // Settings
    settings_title: "Business Preferences",
    settings_subtitle: "Update your roasting math and application settings.",
    settings_business_name: "Business Name",
    settings_business_name_placeholder: "e.g. Dos Tazas Coffee Roasters",
    settings_business_name_hint:
      "Optional. Used for invoices and UI personalization.",
    settings_roast_loss: "Roasting Loss (%)",
    settings_roast_loss_hint:
      "Default: 20%. This automatically scales raw inventory deductions when roasted orders are created.",
    settings_currency: "Currency Symbol",
    settings_currency_hint: "Default: $. Used across the dashboard for prices.",
    settings_language: "Language",
    settings_language_hint: "Choose your preferred language.",
    settings_save_button: "Save Settings",
    settings_saving: "Saving...",
    settings_success: "Settings updated successfully!",
  },
  es: {
    // Common
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    update: "Actualizar",
    loading: "Cargando...",

    // Sidebar
    nav_dashboard: "Tablero",
    nav_pos: "Punto de Venta",
    nav_inventory: "Inventario",
    nav_history: "Historial de Pedidos",
    nav_customers: "Clientes",
    nav_analytics: "Análisis",
    nav_settings: "Configuración",
    sidebar_order_management: "Gestión de Pedidos",
    sidebar_dashboard: "Tablero",
    sidebar_logout: "Cerrar sesión",

    // Orders
    orders_title: "Pedidos",
    orders_subtitle: "Administrar pedidos pendientes, tostados y entregados.",
    orders_new: "Nuevo Pedido",
    orders_create_new: "Crear Nuevo Pedido",
    orders_pending: "Pendiente",
    orders_roasted: "Tostado",
    orders_delivered: "Entregado",
    orders_no_stage_orders: "No hay pedidos en esta etapa.",
    order_unknown_customer: "Cliente Desconocido",
    order_unpaid: "No Pagado",
    order_paid: "Pagado",
    order_total: "Total",
    order_close: "Cerrar",

    // History
    history_title: "Historial de Pedidos",
    history_subtitle:
      "Ver todos los pedidos completados (entregados y pagados).",
    history_no_orders: "Aún No Hay Pedidos Completados",
    history_no_orders_desc:
      "Los pedidos aparecerán aquí una vez que se marquen como entregados y pagados.",

    // Inventory
    inventory_title: "Inventario",
    inventory_subtitle: "Administrar tus materias primas y niveles de stock.",
    inventory_add: "Añadir Stock",
    inventory_add_title: "Añadir Artículo de Inventario",
    inventory_directory: "Directorio de Stock",
    inventory_tracking: "Estás rastreando {count} artículos de inventario.",
    inventory_col_item: "Artículo / Origen",
    inventory_col_category: "Categoría",
    inventory_col_raw: "Stock Crudo",
    inventory_col_yield: "Rendimiento Tostado (Est. -{loss}%)",
    inventory_col_cost: "Costo / kg",
    inventory_no_found: "No se encontró inventario",
    inventory_no_found_desc:
      "Haz clic en 'Añadir Stock' para registrar tu primer lote de café.",
    inv_form_edit: "Editar Artículo de Inventario",
    inv_form_add: "Añadir Artículo de Inventario",
    inv_form_name: "Nombre del Artículo / Origen",
    inv_form_name_placeholder: "ej. Granos Verdes - Finca El Paraíso",
    inv_form_category: "Categoría",
    inv_form_select_cat: "Seleccionar categoría",
    inv_form_cat_green: "Café Verde",
    inv_form_cat_merch: "Mercancía",
    inv_form_cat_equipment: "Equipo",
    inv_form_cost: "Costo por kg ($)",
    inv_form_raw_stock: "Stock Crudo (gramos)",
    inv_form_quantity: "Cantidad",
    inv_form_yield_est: "Rendimiento Tostado Est. (-{loss}% pérdida):",
    inv_form_notes: "Notas (Detalles de origen, etc.)",
    inv_form_notes_placeholder: "ej. Proceso lavado, cosecha 2026",
    inv_form_save: "Guardar Artículo",

    // Order Form
    order_form_edit: "Editar Pedido",
    order_form_new: "Nuevo Pedido",
    order_form_customer: "Cliente",
    order_form_add_customer: "+ Añadir Nuevo Cliente",
    order_form_cancel_customer: "Cancelar Nuevo Cliente",
    order_form_select_customer: "Seleccionar cliente",
    order_form_no_customers:
      "Aún no hay clientes. Haz clic en '+ Añadir Nuevo Cliente' para crear uno.",
    order_form_coffee_bean: "Grano de Café (Inventario)",
    order_form_optional: "(Opcional)",
    order_form_select_bean:
      "Seleccionar grano de café para deducir del inventario",
    order_form_none_manual: "Ninguno (Entrada Manual)",
    order_form_raw_stock: "kg de stock crudo",
    order_form_deduct_info:
      "Si se selecciona, la cantidad de gramos se deducirá automáticamente de tu stock crudo (incluyendo {loss}% de pérdida por tueste) al crearlo.",
    order_form_inventory_warning:
      "La fuente de inventario no se puede cambiar después de la creación del pedido.",
    order_form_preparation: "Preparación",
    order_form_select_method: "Seleccionar método",
    order_form_roast_level: "Nivel de Tueste",
    order_form_select_roast: "Seleccionar tueste",
    order_form_amount: "Cantidad (gramos)",
    order_form_total_price: "Precio Total ($)",
    order_form_origin_notes: "Notas de Origen (Reconocimiento del Productor)",
    order_form_origin_notes_placeholder: "ej. Finca El Paraíso, Diego Bermúdez",
    order_form_update: "Actualizar Pedido",
    order_form_create: "Crear Pedido",

    // Customers
    customers_title: "Clientes",
    customers_subtitle: "Administrar tu base de datos de clientes y contactos.",
    customers_new: "Nuevo Cliente",
    customers_new_title: "Crear Nuevo Cliente",
    customers_directory: "Directorio de Clientes",
    customers_tracking: "Tienes {count} clientes en total.",
    customers_col_name: "Nombre",
    customers_col_phone: "Teléfono",
    customers_col_address: "Dirección",
    customers_col_added: "Añadido el",
    customers_col_last_purchase: "Última Compra",
    customers_col_actions: "Acciones",
    customers_no_found: "No se encontraron clientes",
    customers_no_found_desc:
      "Haz clic en 'Nuevo Cliente' para añadir tu primer cliente.",
    customers_not_provided: "No proporcionado",
    customers_never: "Nunca",

    // Customer Form
    cust_form_edit: "Editar Cliente",
    cust_form_add: "Añadir Cliente",
    cust_form_full_name: "Nombre Completo",
    cust_form_phone: "Número de Teléfono",
    cust_form_address: "Dirección",
    cust_form_save: "Guardar Cliente",

    // Settings
    settings_title: "Preferencias del Negocio",
    settings_subtitle:
      "Actualiza tus cálculos de tueste y configuraciones de la aplicación.",
    settings_business_name: "Nombre del Negocio",
    settings_business_name_placeholder: "ej. Dos Tazas Coffee Roasters",
    settings_business_name_hint:
      "Opcional. Se utiliza para facturas y personalización de la interfaz.",
    settings_roast_loss: "Pérdida por Tueste (%)",
    settings_roast_loss_hint:
      "Predeterminado: 20%. Esto escala automáticamente las deducciones de inventario crudo al crear pedidos de café tostado.",
    settings_currency: "Símbolo de Moneda",
    settings_currency_hint:
      "Predeterminado: $. Se utiliza en todo el tablero para los precios.",
    settings_language: "Idioma",
    settings_language_hint: "Elige tu idioma preferido.",
    settings_save_button: "Guardar Configuración",
    settings_saving: "Guardando...",
    settings_success: "¡Configuración actualizada exitosamente!",
  },
};

export type DictionaryKey = keyof typeof dictionaries.en;
