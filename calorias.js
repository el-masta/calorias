const app = Vue.createApp({
  data() {
    return {
      sexo: "",
      estatura: 1.60,
      anio: 1973,
      mes: "",
      edad: 0,
      pesoActual: 74,
      pesoObjetivo: 70,
      nivelActividad: 2,
      metabolismoBasal: 0,
      calorias: {
        deficitSaludable: null,
        deficitLeve: null,
        mantenimiento: null,
        superavitLeve: null,
        superavitModerado: null,
      },
      errorMessage: [],
      objetivoMessage: ""
    };
  },

  mounted() {
    this.establecerNacimientoPredeterminado();
    this.calcularCalorias();
  },

  computed: {
    leyendaActividad() {
      const leyendas = [
        "No hago ejercicio (sedentario)",
        "Hago ejercicio 1 día a la semana (actividad ligera)",
        "Hago ejercicio 2 días a la semana (actividad moderada)",
        "Hago ejercicio 3 días a la semana (activo)",
        "Hago ejercicio 4 días a la semana (muy activo)",
        "Hago ejercicio 5 o más días a la semana (entrenamiento intenso / atleta)"
      ];
      return leyendas[this.nivelActividad] || "";
    },
    plan() {
      const actual = this.pesoActual;
      const objetivo = this.pesoObjetivo;

      if (objetivo < actual) {
        const diferencia = actual - objetivo;
        if (diferencia >= 10) return 1; // Déficit saludable
        if (diferencia >= 3) return 2;  // Déficit leve
      }
      if (objetivo > actual) {
        const diferencia = objetivo - actual;
        if (diferencia <= 3) return 4;  // Superávit leve
        return 5;                       // Superávit moderado
      }
      return 3; // Mismo peso = Mantenimiento
    }
  },

  methods: {
    establecerNacimientoPredeterminado() {
      const hoy = new Date();
      this.anio = hoy.getFullYear() - 20;
      this.mes = hoy.getMonth() + 1; // Correcto: de 1 a 12
    },

    calcularEdad() {
      const hoy = new Date();
      const mesActual = hoy.getMonth() + 1;
      const edad = hoy.getFullYear() - this.anio - (mesActual < this.mes ? 1 : 0);
      this.edad = edad;
      return edad;
    },

    obtenerFactorActividad() {
      const factores = [1.2, 1.375, 1.55, 1.725, 1.9, 2.0];
      return factores[this.nivelActividad] || 1.2;
    },

    calcularMetabolismoBasal() {
      const peso = this.pesoActual;
      const estaturaCM = this.estatura * 100;
      const edad = this.edad;

      if (this.sexo === "male") {
        return Math.round((10 * peso) + (6.25 * estaturaCM) - (5 * edad) + 5);
      } else if (this.sexo === "female") {
        return Math.round((10 * peso) + (6.25 * estaturaCM) - (5 * edad) - 161);
      } else {
        return 0;
      }
    },

    calcularCalorias() {
      this.calcularEdad()
      if (!this.validarEntradas()) {
        return;
      }
      this.metabolismoBasal = this.calcularMetabolismoBasal();
      const factorActividad = this.obtenerFactorActividad();
      const mantenimiento = this.metabolismoBasal * factorActividad;

      this.calorias = {
        deficitSaludable: Math.round(mantenimiento * 0.79),
        deficitLeve: Math.round(mantenimiento * 0.90),
        mantenimiento: Math.round(mantenimiento),
        superavitLeve: Math.round(mantenimiento * 1.10),
        superavitModerado: Math.round(mantenimiento * 1.20),
      };

      this.establecerObjetivoMessage();
    },

    validarEntradas() {
      this.errorMessage = [];

      // 1. Validar sexo
      if (this.sexo == "") {
        this.errorMessage.push("Debes seleccionar el sexo biológico.");
      }

      // 2. Validar edad
      if (this.edad < 15 || this.edad > 120) {
        this.errorMessage.push("La aplicación está diseñada solo para personas entre 15 y 120 años).");
      }

      // 3. Validar estatura
      if (this.estatura < 1.2 || this.estatura > 2.3) {
        this.errorMessage.push("La estatura debe estar entre 1.20 m y 2.30 m.");
      }

      // 4. Validar peso actual
      if (this.pesoActual < 30 || this.pesoActual > 200) {
        this.errorMessage.push("El peso actual debe estar entre 30 kg y 200 kg.");
      }

      // 5. Validar peso objetivo
      if (this.pesoObjetivo < 30 || this.pesoObjetivo > 200) {
        this.errorMessage.push("El peso objetivo debe estar entre 30 kg y 200 kg.");
      }

      // 6. Validar relación entre peso actual y objetivo
      const relacionPeso = this.pesoObjetivo / this.pesoActual;

      if (relacionPeso < 0.7) {
        this.errorMessage.push("La meta de peso es demasiado baja en relación con tu peso actual.");
      }

      if (relacionPeso > 1.5) {
        this.errorMessage.push("La meta de peso es demasiado alta en relación con tu peso actual.");
      }

      // Si no hay errores, return true (válido)
      return this.errorMessage.length === 0;
    },

    establecerObjetivoMessage() {
      const pesoDiferencia = Math.abs(this.pesoActual - this.pesoObjetivo);
      let semanasEstimadas = 0;

      switch (this.plan) {
        case 1: // Déficit saludable (~0.75 kg/semana)
          semanasEstimadas = pesoDiferencia / 0.75;
          break;
        case 2: // Déficit leve (~0.5 kg/semana)
          semanasEstimadas = pesoDiferencia / 0.5;
          break;
        case 4: // Superávit leve (~0.25 kg/semana)
          semanasEstimadas = pesoDiferencia / 0.5;
          break;
        case 5: // Superávit moderado (~0.4 kg/semana)
          semanasEstimadas = pesoDiferencia / 0.75;
          break;
        default: // Mantenimiento o sin cambio real
          semanasEstimadas = pesoDiferencia / 0.25;
      }
      if (pesoDiferencia == 0) {
        this.objetivoMessage = "Ya estás en tu peso objetivo, o lo lograrás en menos de un mes.";
        return;
      }

      // Convertir semanas a meses o semanas expresivas
      let tiempo = "";
      if (semanasEstimadas <= 6) {
        const semanas = Math.round(semanasEstimadas);
        tiempo = `${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
      } else {
        const meses = semanasEstimadas / 4.345;
        const valor = Math.round(meses);
        tiempo = `${valor} ${valor === 1 ? "mes" : "meses"}`;
      }

      const calorias = this.obtenerCaloriasDelPlan();
      const formateado = this.formatNumber(calorias);
      this.objetivoMessage = `Con ${formateado} calorías por día, lograrás ${this.pesoObjetivo} kg en aproximadamente ${tiempo}`;
    },

    obtenerCaloriasDelPlan() {
      switch (this.plan) {
        case 1: return this.calorias.deficitSaludable;
        case 2: return this.calorias.deficitLeve;
        case 3: return this.calorias.mantenimiento;
        case 4: return this.calorias.superavitLeve;
        case 5: return this.calorias.superavitModerado;
        default: return null;
      }
    }
    ,

    formatNumber(numero) {
      if (numero === null || numero === undefined || isNaN(numero)) return "--";
      return numero.toLocaleString("en-US");
    }
  }
});

app.mount('#appCalorías');
