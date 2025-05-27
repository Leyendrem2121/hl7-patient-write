// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    // Obtiene referencias a los elementos del DOM
    const appointmentForm = document.getElementById('appointmentForm');
    const tipoServicioSelect = document.getElementById('tipoServicio');
    const examenesSection = document.getElementById('examenesSection');
    const messageArea = document.getElementById('messageArea');

    // Función para mostrar mensajes al usuario
    function showMessage(message, type = 'info') {
        messageArea.textContent = message;
        // Limpia todas las clases de estilo anteriores
        messageArea.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-yellow-100', 'text-yellow-700', 'bg-blue-100', 'text-blue-700');
        messageArea.classList.add('block'); // Asegura que el área de mensaje sea visible

        // Aplica estilos según el tipo de mensaje
        if (type === 'success') {
            messageArea.classList.add('bg-green-100', 'text-green-700');
        } else if (type === 'error') {
            messageArea.classList.add('bg-red-100', 'text-red-700');
        } else if (type === 'warning') {
            messageArea.classList.add('bg-yellow-100', 'text-yellow-700');
        } else { // 'info' por defecto
            messageArea.classList.add('bg-blue-100', 'text-blue-700');
        }

        // Opcional: Ocultar el mensaje después de un tiempo
        setTimeout(() => {
            messageArea.classList.add('hidden');
            messageArea.classList.remove('block');
        }, 8000); // El mensaje se oculta después de 8 segundos
    }

    // Event Listener para el cambio en el tipo de servicio
    tipoServicioSelect.addEventListener('change', () => {
        // Si el tipo de servicio es "Toma de Muestra", muestra la sección de exámenes
        if (tipoServicioSelect.value === 'Toma de Muestra') {
            examenesSection.classList.remove('hidden');
        } else {
            // De lo contrario, oculta la sección de exámenes y desmarca todos los checkboxes
            examenesSection.classList.add('hidden');
            const checkboxes = examenesSection.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    });

    // Event Listener para el envío del formulario principal
    appointmentForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previene el envío por defecto del formulario

        // Recolecta los datos del formulario
        const formData = new FormData(appointmentForm);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Manejo especial para los exámenes seleccionados (solo si la sección está visible)
        if (tipoServicioSelect.value === 'Toma de Muestra') {
            const selectedExams = [];
            const checkboxes = examenesSection.querySelectorAll('input[name="examenes"]:checked');
            checkboxes.forEach(checkbox => {
                selectedExams.push(checkbox.value);
            });
            data.examenesSolicitados = selectedExams;
        } else {
            data.examenesSolicitados = []; // Si no es toma de muestra, no hay exámenes
        }

        // Validación básica de campos requeridos
        const requiredFields = [
            'tipoIdentificacion', 'numeroIdentificacion', 'nombre', 'apellido',
            'fechaNacimiento', 'correoElectronico', 'tipoServicio',
            'fechaCita', 'horaCita'
        ];

        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                showMessage(`Por favor, complete el campo "${field}".`, 'error');
                return; // Detiene el envío si un campo requerido está vacío
            }
        }

        // Si es "Toma de Muestra" y no se seleccionó ningún examen
        if (tipoServicioSelect.value === 'Toma de Muestra' && data.examenesSolicitados.length === 0) {
            showMessage('Por favor, seleccione al menos un examen para la toma de muestra.', 'error');
            return;
        }

        // --- Mapear los campos del formulario a la estructura FHIR Patient ---
        const patientFhirData = {
            resourceType: "Patient",
            name: [{
                use: "official",
                given: [data.nombre],
                family: data.apellido
            }],
            gender: data.genero,
            birthDate: data.fechaNacimiento,
            identifier: [{
                system: data.tipoIdentificacion, // Asume que 'CC', 'TI', etc. son sistemas de identificación válidos para tu API FHIR
                value: data.numeroIdentificacion
            }],
            telecom: [{
                system: "phone",
                value: data.telefono,
                use: "home"
            }, {
                system: "email",
                value: data.correoElectronico,
                use: "home"
            }],
            address: [{
                use: "home",
                line: [data.direccion],
                city: data.ciudad,
                postalCode: data.codigoPostal,
                country: "Colombia" // Se mantiene fijo según tu fragmento original
            }],
            // 'epsAseguradora' no es un campo estándar FHIR Patient directo. Podría ser una extensión si fuera necesario en FHIR.
            // Para el backend LIS, lo podemos incluir en datosPacienteLite o en un campo adicional si se mapea.
        };

        // URL del endpoint FHIR para pacientes (servicio externo)
        const fhirPatientEndpoint = 'https://hl7-fhir-ehr-brayan-9053.onrender.com/patient';
        // URL de nuestro propio backend para pacientes (nuevo endpoint)
        const ourBackendPatientEndpoint = 'https://hl7-fhir-ehr-brayan-123456.onrender.com/api/patients';
        // URL de nuestro propio backend para citas
        const ourBackendAppointmentEndpoint = 'https://hl7-fhir-ehr-brayan-123456.onrender.com/api/appointments'; 

        let fhirPatientId = null; // Para almacenar el ID del paciente del servicio FHIR

        try {
            // --- Paso 1: Enviar datos del paciente al servicio FHIR externo ---
            showMessage('Enviando datos del paciente al servicio FHIR...', 'info');
            const responseFhirPatient = await fetch(fhirPatientEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientFhirData)
            });

            if (!responseFhirPatient.ok) {
                const errorText = await responseFhirPatient.text();
                throw new Error(`Error al crear/actualizar el paciente en el servicio FHIR: ${responseFhirPatient.status} - ${errorText}`);
            }

            const fhirPatientDataResponse = await responseFhirPatient.json();
            console.log('Paciente FHIR procesado exitosamente (servicio externo):', fhirPatientDataResponse);
            // El ID del paciente FHIR es crucial para vincular la cita
            fhirPatientId = fhirPatientDataResponse.id || fhirPatientDataResponse._id || fhirPatientDataResponse.resource?.id;
            showMessage('Paciente registrado en el servicio FHIR. Ahora, guardando copia local y procesando la cita...', 'success');


            // --- Paso 2: Enviar los MISMOS datos del paciente a nuestro backend LIS para copia local ---
            // Usamos los mismos patientFhirData, ya que nuestro PatientCrud espera un recurso FHIR válido.
            showMessage('Enviando datos del paciente a nuestro backend LIS (MongoDB) para copia local...', 'info');
            const responseOurBackendPatient = await fetch(ourBackendPatientEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientFhirData) // Enviamos los datos FHIR Patient al backend LIS
            });

            if (!responseOurBackendPatient.ok) {
                const errorText = await responseOurBackendPatient.text();
                throw new Error(`Error al guardar el paciente en nuestro backend LIS: ${responseOurBackendPatient.status} - ${errorText}`);
            }

            const ourBackendPatientDataResponse = await responseOurBackendPatient.json();
            console.log('Paciente guardado en nuestro backend LIS exitosamente:', ourBackendPatientDataResponse);
            showMessage('Paciente registrado en ambos sistemas. Ahora, procesando la cita...', 'success');


            // --- Paso 3: Enviar los datos de la Cita a nuestro backend LIS ---
            const appointmentDataForMongoDB = {
                idPacienteFHIR: fhirPatientId, // Usamos el ID del paciente del servicio FHIR
                tipoServicio: data.tipoServicio,
                fechaCita: data.fechaCita,
                horaCita: data.horaCita,
                examenesSolicitados: data.examenesSolicitados,
                notasPaciente: data.notasPaciente,
                estadoCita: 'Pendiente', // Estado inicial de la cita
                fechaCreacion: new Date().toISOString(), // Fecha y hora actual de la creación de la cita
                // Incluimos datos básicos del paciente para facilitar búsquedas sin necesidad de consultar siempre FHIR
                datosPacienteLite: {
                    nombreCompleto: `${data.nombre} ${data.apellido}`,
                    numeroIdentificacion: data.numeroIdentificacion,
                    correoElectronico: data.correoElectronico,
                    telefono: data.telefono,
                    // Opcional: Podrías añadir el ID interno de MongoDB si lo devuelve ourBackendPatientDataResponse
                    // idPacienteMongoDB: ourBackendPatientDataResponse.patientId
                }
            };

            showMessage('Enviando datos de la cita a nuestro backend LIS...', 'info');

            const responseAppointment = await fetch(ourBackendAppointmentEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentDataForMongoDB)
            });

            if (!responseAppointment.ok) {
                const errorDataAppointment = await responseAppointment.json();
                throw new Error(`Error al guardar la cita en el backend LIS: ${responseAppointment.status} - ${JSON.stringify(errorDataAppointment)}`);
            }

            const savedAppointmentData = await responseAppointment.json();
            console.log('Cita guardada en MongoDB exitosamente por el backend:', savedAppointmentData);
            showMessage('¡Cita agendada exitosamente en nuestro sistema LIS!', 'success');
            
            // Limpia el formulario después del envío exitoso
            appointmentForm.reset();
            examenesSection.classList.add('hidden'); // Oculta la sección de exámenes nuevamente


        } catch (error) {
            console.error('Error general en el proceso de agendamiento:', error);
            showMessage(`Hubo un error al agendar la cita: ${error.message || 'Error desconocido'}. Por favor, intente de nuevo.`, 'error');
        }
    });
});
