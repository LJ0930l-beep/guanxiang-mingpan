declare module 'circular-natal-horoscope-js/dist/index.js' {
  class Origin {
    constructor(input: {
      year: number;
      month: number;
      date: number;
      hour: number;
      minute: number;
      second?: number;
      latitude: number;
      longitude: number;
    });
  }

  class Horoscope {
    constructor(input: Record<string, unknown>);
    CelestialBodies: { all: unknown[] };
    Ascendant: unknown;
    Midheaven: unknown;
    Aspects: { all: unknown[] };
  }

  export { Origin, Horoscope };
}
