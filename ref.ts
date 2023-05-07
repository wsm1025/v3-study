class RefImpl {
  private _value;
  constructor(value: any) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  //   set value{}
}
export function ref(value) {
  return new RefImpl(value);
}
