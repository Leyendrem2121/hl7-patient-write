document.addEventListener('DOMContentLoaded', function () {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    // Datos estáticos ejemplo para Colombia y México
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

    // Función para llenar el select de países
    function populateCountries() {
        countrySelect.innerHTML = '<option value="">-- Selecciona un país --</option>';
        for (const code in data) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data[code].name;
            countrySelect.appendChild(option);
        }
    }

    // Función para llenar departamentos/estados según país
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

    // Función para llenar ciudades según departamento
    function populateCities(countryCode, stateName) {
        citySelect.innerHTML = '<option value="">-- Selecciona una ciudad --</option>';

        if (!countryCode || !stateName || !data[countryCode] || !data[countryCode].states[stateName]) {
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

    // Eventos para actualizar dependencias
    countrySelect.addEventListener('change', () => {
        populateStates(countrySelect.value);
        citySelect.innerHTML = '<option value="">-- Selecciona una ciudad --</option>';
        citySelect.disabled = true;
    });

    stateSelect.addEventListener('change', () => {
        populateCities(countrySelect.value, stateSelect.value);
    });

    // Inicializamos selects
    populateCountries();

    // Opcional: carga inicial país Colombia seleccionado
    countrySelect.value = 'COL';
    populateStates('COL');
});
