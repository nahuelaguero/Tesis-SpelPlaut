import { ValidationError } from "./error-handler";

export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export interface FieldValidation {
  required?: boolean;
  rules?: ValidationRule[];
}

export interface FormValidation {
  [key: string]: FieldValidation;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Reglas de validación predefinidas
export const validationRules = {
  email: {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Formato de email inválido",
  },
  password: {
    validate: (value: string) => value.length >= 8,
    message: "La contraseña debe tener al menos 8 caracteres",
  },
  strongPassword: {
    validate: (value: string) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        value
      ),
    message:
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo",
  },
  phone: {
    validate: (value: string) =>
      /^[\d\s\-\+\(\)]{10,15}$/.test(value.replace(/\s/g, "")),
    message: "Formato de teléfono inválido",
  },
  price: {
    validate: (value: string | number) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      return !isNaN(num) && num > 0;
    },
    message: "El precio debe ser un número mayor a 0",
  },
  time: {
    validate: (value: string) =>
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
    message: "Formato de hora inválido (HH:MM)",
  },
  date: {
    validate: (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message: "La fecha debe ser futura",
  },
  capacity: {
    validate: (value: string | number) => {
      const num = typeof value === "string" ? parseInt(value) : value;
      return Number.isInteger(num) && num > 0 && num <= 50;
    },
    message: "La capacidad debe ser un número entero entre 1 y 50",
  },
  name: {
    validate: (value: string) => value.trim().length >= 2,
    message: "El nombre debe tener al menos 2 caracteres",
  },
  description: {
    validate: (value: string) => value.trim().length >= 10,
    message: "La descripción debe tener al menos 10 caracteres",
  },
};

// Esquemas de validación para diferentes formularios
export const validationSchemas = {
  login: {
    email: {
      required: true,
      rules: [validationRules.email],
    },
    contrasena: {
      required: true,
      rules: [validationRules.password],
    },
  },
  register: {
    nombre_completo: {
      required: true,
      rules: [validationRules.name],
    },
    email: {
      required: true,
      rules: [validationRules.email],
    },
    telefono: {
      required: true,
      rules: [validationRules.phone],
    },
    contrasena: {
      required: true,
      rules: [validationRules.strongPassword],
    },
  },
  cancha: {
    descripcion: {
      required: true,
      rules: [validationRules.description],
    },
    tipo_cancha: {
      required: true,
    },
    ubicacion: {
      required: true,
      rules: [validationRules.name],
    },
    precio_por_hora: {
      required: true,
      rules: [validationRules.price],
    },
    capacidad_jugadores: {
      required: true,
      rules: [validationRules.capacity],
    },
    horario_apertura: {
      required: true,
      rules: [validationRules.time],
    },
    horario_cierre: {
      required: true,
      rules: [validationRules.time],
    },
  },
  reserva: {
    fecha: {
      required: true,
      rules: [validationRules.date],
    },
    hora_inicio: {
      required: true,
      rules: [validationRules.time],
    },
    hora_fin: {
      required: true,
      rules: [validationRules.time],
    },
  },
  changePassword: {
    contrasena_actual: {
      required: true,
    },
    nueva_contrasena: {
      required: true,
      rules: [validationRules.strongPassword],
    },
    confirmar_contrasena: {
      required: true,
    },
  },
} as const;

export function validateField(
  value: unknown,
  fieldValidation: FieldValidation
): string | null {
  // Verificar si es requerido
  if (
    fieldValidation.required &&
    (!value || (typeof value === "string" && !value.trim()))
  ) {
    return "Este campo es requerido";
  }

  // Si no hay valor y no es requerido, es válido
  if (!value || (typeof value === "string" && !value.trim())) {
    return null;
  }

  // Aplicar reglas de validación
  if (fieldValidation.rules) {
    for (const rule of fieldValidation.rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
  }

  return null;
}

export function validateForm(
  data: Record<string, unknown>,
  schema: FormValidation
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldValidation] of Object.entries(schema)) {
    const error = validateField(data[fieldName], fieldValidation);
    if (error) {
      errors[fieldName] = error;
    }
  }

  // Validaciones especiales
  if ("contrasena_actual" in schema && "nueva_contrasena" in schema) {
    if (data.nueva_contrasena !== data.confirmar_contrasena) {
      errors.confirmar_contrasena = "Las contraseñas no coinciden";
    }
  }

  if (
    "descripcion" in schema &&
    "tipo_cancha" in schema &&
    "horario_apertura" in schema
  ) {
    const apertura = data.horario_apertura as string;
    const cierre = data.horario_cierre as string;

    if (apertura && cierre && apertura >= cierre) {
      errors.horario_cierre =
        "El horario de cierre debe ser posterior al de apertura";
    }
  }

  if ("fecha" in schema && "hora_inicio" in schema && "hora_fin" in schema) {
    const inicio = data.hora_inicio as string;
    const fin = data.hora_fin as string;

    if (inicio && fin && inicio >= fin) {
      errors.hora_fin = "La hora de fin debe ser posterior a la de inicio";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function throwValidationError(
  data: Record<string, unknown>,
  schema: FormValidation
): void {
  const result = validateForm(data, schema);
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0];
    throw new ValidationError(firstError);
  }
}

// Hook personalizado para validación en tiempo real
export function useFormValidation(schema: FormValidation) {
  return {
    validate: (data: Record<string, unknown>) => validateForm(data, schema),
    validateField: (fieldName: string, value: unknown) =>
      validateField(value, schema[fieldName]),
  };
}
