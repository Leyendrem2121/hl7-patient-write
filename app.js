// Espera a que el DOM esté completamente cargado antes de añadir el event listener
document.addEventListener('DOMContentLoaded', function() {
    // Obtiene una referencia al formulario y al div de mensajes
    const patientForm = document.getElementById('patientForm');
    const responseMessageDiv = document.getElementById('responseMessage');

    // Función para mostrar mensajes al usuario
    function showMessage(message, type) {
        responseMessageDiv.textContent = message;
        responseMessageDiv.className = ''; // Limpia clases anteriores
        responseMessageDiv.classList.add(type); // Añade clase 'success' o 'error'
        responseMessageDiv.style.display = 'block'; // Asegura que el div sea visible
    }

    // Añade un event listener para el evento 'submit' del formulario
    patientForm.addEventListener('submit', async function(event) {
        // Previene el comportamiento por defecto del formulario (recargar la página)
        event.preventDefault();

        // Oculta cualquier mensaje anterior
        responseMessageDiv.style.display = 'none';

        // Obtener los valores del formulario
        const name = document.getElementById('name').value;
        const familyName = document.getElementById('familyName').value;
        const gender = document.getElementById('gender').value;
        const birthDate = document.getElementById('birthDate').value;
        const identifierSystemValue = document.getElementById('identifierSystem').value;
        const identifierValue = document.getElementById('identifierValue').value;
        const cellPhone = document.getElementById('cellPhone').value;
        const email = document.getElementById('email').value;
        const addressLine = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value; // Nuevo campo
        const postalCode = document.getElementById('postalCode').value;
        const country = document.getElementById('country').value; // Nuevo campo

        // Parsear el sistema y el código del identificador (ej: "http://system|code")
        const [identifierSystem, identifierCode] = identifierSystemValue.split('|');

        // Generar un ID simple para el recurso Patient (en un sistema real, el backend podría generarlo)
        const patientFhirId = `patient-${Date.now()}`;

        // Crear el objeto Patient en formato HL7 FHIR
        const patientFhirResource = {
            resourceType: "Patient",
            id: patientFhirId, // ID del recurso FHIR
            active: true, // El paciente está activo
            identifier: [{
                use: "official", // Uso oficial del identificador
                type: {
                    coding: [{
                        system: identifierSystem, // Sistema de codificación del identificador
                        code: identifierCode // Código del identificador (ej: 'ID' para cédula)
                    }]
                },
                value: identifierValue // Valor del identificador (ej: el número de cédula)
            }],
            name: [{
                use: "official", // Uso oficial del nombre
                given: [name], // Nombres
                family: familyName // Apellidos
            }],
            telecom: [
                {
                    system: "phone",
                    value: cellPhone,
                    use: "mobile" // Uso móvil para el teléfono celular
                },
                {
                    system: "email",
                    value: email,
                    use: "home" // Uso personal para el correo electrónico
                }
            ],
            gender: gender,
            birthDate: birthDate,
            address: [{
                use: "home", // Uso de la dirección (domicilio)
                line: [addressLine], // Línea de dirección
                city: city,
                state: state, // Estado/Departamento
                postalCode: postalCode,
                country: country // País
            }]
            // Aquí podrías añadir más extensiones o campos FHIR si fueran necesarios
            // para el agendamiento o la recolección de muestras, como se vio en el ejemplo anterior
        };

        console.log("Datos FHIR a enviar:", JSON.stringify(patientFhirResource, null, 2));

        try {
            // Enviar los datos usando Fetch API a tu backend
            // IMPORTANTE: Reemplaza esta URL con la URL real de tu backend
            const backendUrl = 'https://hl7-fhir-ehr-brayan12345.onrender.com/patients'; // Sugerencia: añadir un endpoint /patients
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientFhirResource)
            });

            if (!response.ok) {
                // Si la respuesta no es OK (ej. 400, 500), lanzar un error
                const errorData = await response.json();
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('Success:', data);
            showMessage('Paciente registrado exitosamente! ID: ' + (data.insertedId || patientFhirId), 'success');
            patientForm.reset(); // Limpiar el formulario después del éxito

        } catch (error) {
            console.error('Error al enviar datos:', error);
            showMessage('Hubo un error al registrar el paciente: ' + error.message, 'error');
        }
    });
});
