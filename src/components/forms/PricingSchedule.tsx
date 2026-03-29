"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DiaSemana, PrecioHorario } from "@/types";

const days: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

interface PricingScheduleProps {
  basePrice: number;
  intervalMinutes: number;
  rules: PrecioHorario[];
  onChange: (value: {
    basePrice: number;
    intervalMinutes: number;
    rules: PrecioHorario[];
  }) => void;
}

function createEmptyRule(): PrecioHorario {
  return {
    nombre: "",
    dias_semana: ["lunes", "martes", "miercoles", "jueves", "viernes"],
    hora_inicio: "06:00",
    hora_fin: "12:00",
    precio_por_hora: 0,
  };
}

export function PricingSchedule({
  basePrice,
  intervalMinutes,
  rules,
  onChange,
}: PricingScheduleProps) {
  const updateRules = (nextRules: PrecioHorario[]) => {
    onChange({
      basePrice,
      intervalMinutes,
      rules: nextRules,
    });
  };

  const updateRule = (index: number, patch: Partial<PrecioHorario>) => {
    const nextRules = rules.map((rule, currentIndex) =>
      currentIndex === index ? { ...rule, ...patch } : rule
    );
    updateRules(nextRules);
  };

  const toggleDay = (index: number, day: DiaSemana) => {
    const rule = rules[index];
    const nextDays = rule.dias_semana.includes(day)
      ? rule.dias_semana.filter((currentDay) => currentDay !== day)
      : [...rule.dias_semana, day];

    updateRule(index, { dias_semana: nextDays });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="precio-base">Precio base por hora (Gs.)</Label>
          <Input
            id="precio-base"
            type="number"
            min="1"
            step="1000"
            value={basePrice}
            onChange={(event) =>
              onChange({
                basePrice: Number(event.target.value) || 0,
                intervalMinutes,
                rules,
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="intervalo-reserva">Intervalo entre reservas</Label>
          <select
            id="intervalo-reserva"
            value={intervalMinutes}
            onChange={(event) =>
              onChange({
                basePrice,
                intervalMinutes: Number(event.target.value),
                rules,
              })
            }
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Precios por franja</h3>
            <p className="text-sm text-gray-600">
              Crea reglas por día y horario. Si una franja no tiene regla, se
              usa el precio base.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => updateRules([...rules, createEmptyRule()])}
          >
            Agregar franja
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
              No hay reglas cargadas. Se aplicará el precio base todo el día.
            </div>
          ) : (
            rules.map((rule, index) => (
              <div
                key={`${rule.nombre || "regla"}-${index}`}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>Nombre de la franja</Label>
                    <Input
                      value={rule.nombre || ""}
                      onChange={(event) =>
                        updateRule(index, { nombre: event.target.value })
                      }
                      placeholder="Mañana, noche, finde..."
                    />
                  </div>

                  <div>
                    <Label>Desde</Label>
                    <Input
                      type="time"
                      step={intervalMinutes * 60}
                      value={rule.hora_inicio}
                      onChange={(event) =>
                        updateRule(index, { hora_inicio: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Hasta</Label>
                    <Input
                      type="time"
                      step={intervalMinutes * 60}
                      value={rule.hora_fin}
                      onChange={(event) =>
                        updateRule(index, { hora_fin: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Precio por hora (Gs.)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1000"
                    value={rule.precio_por_hora}
                    onChange={(event) =>
                      updateRule(index, {
                        precio_por_hora: Number(event.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="mt-4">
                  <Label>Días aplicables</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {days.map((day) => {
                      const active = rule.dias_semana.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(index, day)}
                          className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                            active
                              ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                              : "border-gray-300 bg-white text-gray-600"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateRules(
                        rules.filter((_, currentIndex) => currentIndex !== index)
                      )
                    }
                  >
                    Eliminar franja
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
