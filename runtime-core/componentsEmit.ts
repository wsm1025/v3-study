import { camelize, handlerKey } from "../share/index";

export function emit(instance: { props: any }, event: string, ...args) {
  console.log("emit", event);
  // instance.props => event
  const { props } = instance;
  // TPP

  const handler = props[handlerKey(camelize(event))];
  handler && handler(...args);
}
