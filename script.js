document.addEventListener('DOMContentLoaded', () => {

    // ===================================
    // 1. DATOS ESTÁTICOS Y BASE64 PARA PDF
    // ===================================
    const colorImageMap = {
        "Blanco": "CorollaHybrid-blanco_4x-01.jpg",
        "Plata Metálico": "CorollaHybrid-gris_0x-01.jpg", 
        "Rojo Mica Metálico": "CorollaHybrid-rojo_0x-01.jpg", 
        "Negro Metálico": "CorollaHybrid-negro_0x-01.jpg", 
        "Blanco Perlado": "CorollaHybrid-perla_0x-01.jpg", 
        "Gris Celestial": "CorollaHybrid-azul_0x-01.jpg", 
        "Marrón Perlado": "CorollaHybrid-marron_0x-01.jpg" 
    };
    
    const PRECIOS_MODELOS = {
        "COROLLA 1.6 XLI MT": { usd: 23940, pen: 95760 },
        "COROLLA XLI 1.6 MT GLP": { usd: 24440, pen: 97760 },
        "COROLLA 1.6 XLI CVT": { usd: 25230, pen: 100920 },
        "COROLLA XLI 1.6 CVT GLP": { usd: 25730, pen: 102920 },
        "COROLLA 1.6 XEI MT": { usd: 26170, pen: 104680 },
        "COROLLA HV 1.8 XEI CVT": { usd: 31020, pen: 124080 },
        "COROLLA HV 1.8 SEG CVT": { usd: 34730, pen: 138920 }
    };

    // Mapeo simple de tiendas (usado para imprimir en PDF)
    const DIRECCIONES_TIENDA = {
        "Tienda A": "Tienda A (Ejemplo Dirección 1)",
        "Tienda B": "Tienda B (Ejemplo Dirección 2)",
        "San Miguel": "San Miguel (Av. Ejemplo 123)",
        "La Molina": "La Molina (Av. Ejemplo 456)"
    };
    
    // Mapeo para Decision de Compra (Clave del HTML a Texto del PDF)
    const OPCIONES_COMPRA = {
        "Inmediato": "0 - 3 meses (Lo más pronto posible)",
        "3-6meses": "3 - 6 meses",
        "7+meses": "7 meses a más",
        "solo_informacion": "Solo busco información"
    };
    
    // Mapeo para longitud de documento
    const LONGITUD_DOCUMENTO = {
        "DNI": 8,
        "RUC": 11,
        "CE": 9 
    };

    // BASE64: Logo de la empresa para el PDF (Asegúrate de que esta ruta sea válida)
    const LOGO_BASE64 = "images/LOGOS_Grupo Pana-02-2.png"; // Usamos la imagen local si es posible, sino usa el base64 de emergencia.
    // Base64 de emergencia (si la línea anterior falla)
    const LOGO_BASE64_EMERGENCY = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAgAQQDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAECBAMFBwb/xAA9EAACAQMCAwUFBQYFBQEBAAABAgMEEQASBSExQQYTUQciYRQyQlKBQmKRwRViY4IzsSRDc6LC8PH/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECBAX/xAAiEQEBAQEAAgICAwEBAAAAAAABAhESIQMxQQQyUSJhcSL/2gAARCAAgAQQDASIAAhEBAR/9gAwBAQA//wD9//g/19P6n+v/AC/19P6/3/t/9L/p9f8A7/n8/wC39/7/AKvX/wA/6v9f73f7/P8AD/f+v9/7/wBf/g/1/wA7/X/f9b/P+39/8v8P/9k="; 
    
    function getModelPrices(modelo) {
        return PRECIOS_MODELOS[modelo] || { usd: 'N/A', pen: 'N/A' };
    }
    
    function getStoreAddress(tiendaKey) {
        return DIRECCIONES_TIENDA[tiendaKey] || tiendaKey; 
    }

    function getCompraOption(optionKey) {
        return OPCIONES_COMPRA[optionKey] || optionKey;
    }

    // ===================================
    // NUEVA FUNCIÓN: GUARDADO DE DATOS (PARA EL PANEL)
    // ===================================
    function guardarCotizacion(formData) {
        const datosCliente = {
            fecha: new Date().toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            modelo: formData.modelo,
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            celular: formData.celular,
            email: formData.email,
            documentoTipo: formData.documento_tipo || 'N/A',
            documentoNumero: formData.documento_numero,
            tienda: formData.tienda,
            decisionCompra: getCompraOption(formData.compra_decision) // Guardar el texto descriptivo
        };

        // 1. Obtener las cotizaciones existentes (o un array vacío)
        let cotizaciones = JSON.parse(localStorage.getItem('cotizacionesClientes')) || [];

        // 2. Agregar la nueva cotización
        cotizaciones.push(datosCliente);

        // 3. Guardar la lista actualizada en el navegador
        localStorage.setItem('cotizacionesClientes', JSON.stringify(cotizaciones));
    }


    // ===================================
    // 2. LÓGICA DE PESTAÑAS (TABS)
    // ===================================
    const tabLinks = document.querySelectorAll('.sub-nav-tabs .tab-link'); 
    const sections = document.querySelectorAll('.tab-content-container .content-section');

    function showTab(tabId) {
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        const activeSection = document.getElementById(tabId);
        if (activeSection) {
            activeSection.style.display = 'block';
            activeSection.classList.add('active');
        }
    }

    // Inicializar la primera pestaña visible
    const defaultTabLink = document.querySelector('.tab-link[data-tab="diseno"]');
    if (defaultTabLink) {
        showTab(defaultTabLink.getAttribute('data-tab'));
    }
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            tabLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            const corollaTitle = document.querySelector('.sub-nav-tabs .tab-title');
            if (corollaTitle) {
                 corollaTitle.classList.add('active');
            }

            const tabId = e.target.getAttribute('data-tab');
            showTab(tabId); 
            
            document.getElementById('features-menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });


    // ===================================
    // 3. EFECTO SCROLL REVEAL (Animación)
    // ===================================
    const animatedElements = document.querySelectorAll('.scroll-animation');

    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // ===================================
    // 4. LÓGICA DE SELECCIÓN DE COLORES
    // ===================================
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const colorNameDisplay = document.getElementById('color-name-display');
    const carColorDisplay = document.getElementById('car-color-display'); 

    // Inicializar la selección de color
    if (colorSwatches.length > 0 && carColorDisplay && colorNameDisplay) {
        const initialColor = colorSwatches[0].getAttribute('data-color');
        colorSwatches.forEach(s => s.classList.remove('selected')); 
        colorSwatches[0].classList.add('selected'); 
        colorNameDisplay.textContent = initialColor;
        const initialFilename = colorImageMap[initialColor];
        if (initialFilename) {
            carColorDisplay.src = `images/${initialFilename}`;
            carColorDisplay.alt = `Toyota Corolla Color ${initialColor}`;
        }
    }
    
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            colorSwatches.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            
            const selectedColorName = this.getAttribute('data-color');
            colorNameDisplay.textContent = selectedColorName;
            
            const filename = colorImageMap[selectedColorName];
            
            if (filename) {
                carColorDisplay.src = `images/${filename}`;
                carColorDisplay.alt = `Toyota Corolla Color ${selectedColorName}`;
            }
        });
    });

    
    // ===================================
    // 5. FUNCIÓN PARA GENERAR EL PDF (jsPDF)
    // ===================================
    function generateQuotePDF(formData) {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error("Librería jsPDF no cargada. No se puede generar el PDF.");
            alert("Error: No se pudo cargar la herramienta de PDF.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15; 
        const margin = 15;
        const prices = getModelPrices(formData.modelo);
        
        // --- CABECERA (LOGO, TÍTULO Y FECHA) ---
        try {
             doc.addImage(LOGO_BASE64, 'JPEG', 155, 10, 40, 15);
        } catch (error) {
             doc.addImage(LOGO_BASE64_EMERGENCY, 'JPEG', 155, 10, 40, 15);
        }
        
        doc.setFontSize(22);
        doc.setTextColor(255, 0, 0); 
        doc.setFont(undefined, 'bold');
        doc.text("COTIZACIÓN OFICIAL TOYOTA COROLLA", margin, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); 
        doc.setFont(undefined, 'normal');
        doc.text(`Generada el: ${new Date().toLocaleDateString()}`, margin, y);
        y += 10;

        // --- BLOQUE: VEHÍCULO Y PRECIO ---
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, y, 180, 75); 
        
        // Marcador de imagen
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin + 5, y + 5, 65, 65);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("IMAGEN DEL VEHÍCULO", margin + 37.5, y + 37.5, null, null, "center");
        doc.setTextColor(0, 0, 0);

        const infoX = margin + 80; // Posición de la información (derecha del recuadro de imagen)

        // Título del Bloque de Vehículo
        doc.setFontSize(15);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text("I. Vehículo Seleccionado", infoX, y + 8);
        
        // Modelo
        doc.setFontSize(14);
        doc.text(`Modelo: ${formData.modelo || 'No especificado'}`, infoX, y + 18);
        
        // Color Seleccionado
        doc.setFontSize(14);
        doc.text(`Color: ${formData.colorSeleccionado || 'No especificado'}`, infoX, y + 28);
        
        // Separador visual
        doc.line(infoX, y + 32, margin + 180 - 5, y + 32); 

        // Precios
        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0); 
        doc.setFont(undefined, 'normal');
        doc.text("Precio de Lista (USD):", infoX, y + 42);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`USD ${prices.usd.toLocaleString()}`, infoX, y + 50);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text("Precio de Lista (Soles):", infoX, y + 60);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`S/ ${prices.pen.toLocaleString()}`, infoX, y + 68);
        
        y += 85; 

        // --- SECCIÓN II: DATOS DE CONTACTO DEL CLIENTE ---
        doc.setDrawColor(0);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 180, 7, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("II. Datos de contacto del cliente", margin + 2, y + 5);
        y += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const x1 = margin;
        const x2 = margin + 50;
        
        doc.text("Nombre Completo:", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(`${formData.nombres} ${formData.apellidos}`, x2, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.text("Celular:", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(formData.celular, x2, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.text("Email:", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(formData.email, x2, y);
        y += 7;

        doc.setFont(undefined, 'normal');
        doc.text("Documento (Nro/Tipo):", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(`${formData.documento_numero} (${formData.documento_tipo || 'N/A'})`, x2, y);
        y += 7;
        
        const tiendaNombre = getStoreAddress(formData.tienda);
        doc.setFont(undefined, 'normal');
        doc.text("Tienda de Preferencia:", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(tiendaNombre || 'No especificado', x2, y);
        y += 7;

        const compraTexto = getCompraOption(formData.compra_decision);
        doc.setFont(undefined, 'normal');
        doc.text("Decisión de Compra:", x1, y);
        doc.setFont(undefined, 'bold');
        doc.text(compraTexto || 'No especificado', x2, y);
        y += 15;


        // NOTA LEGAL
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("Esta es una cotización simulada y no representa un compromiso contractual. Los precios y el tipo de cambio están sujetos a cambios.", margin, doc.internal.pageSize.height - 10);

        // Guardar el PDF
        doc.save(`Cotizacion_Corolla_${formData.apellidos}.pdf`);
    }

    // ===================================
    // 6. VALIDACIONES DE LONGITUD Y FORMATO EN TIEMPO REAL
    // (TU CÓDIGO DE VALIDACIÓN ORIGINAL)
    // ===================================
    const celularInput = document.getElementById('celular');
    const documentoTipoRadios = document.querySelectorAll('input[name="documento_tipo"]');
    const documentoNumeroInput = document.getElementById('documento_numero');

    function applyInputMask(input, maxLength) {
        input.setAttribute('maxlength', maxLength);
        input.setAttribute('pattern', `[0-9]{${maxLength}}`);
        input.setAttribute('title', `Debe contener exactamente ${maxLength} dígitos numéricos.`);
        input.setAttribute('inputmode', 'numeric');
    }
    
    // VALIDACIÓN DE CELULAR (9 DÍGITOS)
    if (celularInput) {
        applyInputMask(celularInput, 9);
        celularInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // VALIDACIÓN DE NÚMERO DE DOCUMENTO (DNI/RUC/CE)
    if (documentoNumeroInput) {
        
        const updateDocumentMask = () => {
            const selectedRadio = document.querySelector('input[name="documento_tipo"]:checked');
            let maxLength = 0;
            
            if (selectedRadio) {
                const tipo = selectedRadio.value;
                maxLength = LONGITUD_DOCUMENTO[tipo] || 0;
            }
            
            if (maxLength > 0) {
                 applyInputMask(documentoNumeroInput, maxLength);
                 documentoNumeroInput.value = documentoNumeroInput.value.replace(/[^0-9]/g, '').substring(0, maxLength); 
            } else {
                 documentoNumeroInput.removeAttribute('maxlength');
                 documentoNumeroInput.removeAttribute('pattern');
                 documentoNumeroInput.removeAttribute('title');
            }
        };

        documentoTipoRadios.forEach(radio => {
            radio.addEventListener('change', updateDocumentMask);
        });

        documentoNumeroInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        updateDocumentMask(); 
    }


    // ===================================
    // 7. LÓGICA DE ENVÍO DE FORMULARIO
    // ===================================
    const form = document.querySelector('.detailed-form'); 
    if (form) {
        form.addEventListener('submit', (e) => {
            
            if (!form.checkValidity()) {
                e.preventDefault(); 
                return;
            }
            
            e.preventDefault(); 
            
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // 1. Obtener datos del formulario
            const formData = {
                modelo: form.modelo.value,
                nombres: form.nombres.value,
                apellidos: form.apellidos.value,
                celular: form.celular.value,
                email: form.email.value,
                documento_tipo: form.querySelector('input[name="documento_tipo"]:checked')?.value,
                documento_numero: form.documento_numero.value,
                tienda: form.tienda.value,
                compra_decision: form.compra_decision.value,
                colorSeleccionado: document.getElementById('color-name-display').textContent
            };


            submitButton.textContent = 'Generando PDF...';
            submitButton.disabled = true;

            // 2. Ejecutar la lógica de guardado y PDF
            setTimeout(() => {
                
                guardarCotizacion(formData); // <--- ¡AQUÍ SE REGISTRA EL CLIENTE!
                generateQuotePDF(formData); 
                
                alert(`¡Tu solicitud ha sido enviada y registrada! Se ha generado el archivo: Cotizacion_Corolla_${formData.apellidos}.pdf`);
                
                // 3. Resetear el formulario y el botón
                form.reset(); 
                
                // RESTABLECER LA VISUALIZACIÓN DEL COLOR
                const defaultColorSwatch = document.querySelector('.color-swatch[data-color="Blanco"]');
                if (defaultColorSwatch) {
                    colorSwatches.forEach(s => s.classList.remove('selected'));
                    // No llamamos click() porque eso dispara todo el listener, solo hacemos el cambio visual
                    colorNameDisplay.textContent = 'Blanco';
                    carColorDisplay.src = `images/${colorImageMap['Blanco']}`;
                    defaultColorSwatch.classList.add('selected'); 
                }
                
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
            }, 1500);
        });
    }

});