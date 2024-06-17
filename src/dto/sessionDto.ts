interface Data {
  condition: string;
  level: string | null;
}

export class SessionDTO {
  data: Data[];
  constructor(data: Data[]) {
    this.data = data;
  }
}
