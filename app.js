document.addEventListener('DOMContentLoaded', function () {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    const data = {
        COL: {
            name: "Colombia",
            states: {
                "Cundinamarca": ["Bogotá", "Soacha", "Chía", "Zipaquirá"],
                "Antioquia": ["Medellín", "Envigado", "Bello", "Itagüí"],
                "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá"]
            }
        },
        MEX: {
            name: "México",
            states: {
                "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque"],
                "Ciudad de México": ["Coyoacán", "Tlalpan", "Xochimilco"],
                "Nuevo León": ["Monterrey", "San Nicolás", "Guadalupe"]
            }
        }
    };

    function populateCountries() {
        countrySelect.innerHTML = '<option value="">-- Selecciona un país --</option>';
        for (const code in data) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data[code].name;
            countrySelect.appendChild(option);
        }
    }

    function populateStates(countryCode) {
        stateSelect.innerHTML = '<option value="">-- Selecciona un departamento --</option>';
        citySelect.innerHTML = '<option value="">-- Selecciona una ciudad --</option>';
        citySelect.disabled = true;

        if (!countryCode || !data[countryCode]) {
            stateSelect.disabled = true;
            return;
        }

        const states = Object.keys(data[countryCode].states);
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
        stateSelect.disabled = false;
    }

    function populateCities(countryCode, stateName) {
        citySelect.innerHTML = '<option value="">-- Selecciona una ciudad --</option>';

        if (!countryCode || !stateName || !data[countryCode]?.states[stateName]) {
            citySelect.disabled = true;
            return;
        }

        const cities = data[countryCode].states[stateName];
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
    }

    countrySelect.addEventListener('change', () => {
        populateStates(countrySelect.value);
        citySelect.innerHTML = '<option value="">-- Selecciona una ciudad --</option>';
        citySelect.disabled = true;
    });

    stateSelect.addEventListener('change', () => {
        populateCities(countrySelect.value, stateSelect.value);
    });

    // Inicialización
    populateCountries();
    countrySelect.value = 'COL';
    populateStates('COL');

    // Envío del formulario al backend
    document.getElementById('patientForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const dataToSend = {};

        formData.forEach((value, key) => {
            dataToSend[key] = value;
        });

        try {
            const response = await fetch('https://hl7-fhir-ehr-brayan12345.onrender.com/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();
            const messageBox = document.getElementById('responseMessage');

            if (response.ok) {
                messageBox.textContent = 'Paciente registrado exitosamente.';
                messageBox.className = 'success';
            } else {
                messageBox.textContent = `Error: ${result.detail || 'No se pudo registrar el paciente.'}`;
                messageBox.className = 'error';
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            const messageBox = document.getElementById('responseMessage');
            messageBox.textContent = 'Error de red o del servidor.';
            messageBox.className = 'error';
        }
    });
});
