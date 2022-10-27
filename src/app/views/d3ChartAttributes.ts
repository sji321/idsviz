export interface D3ChartAttributes {
  svg: any;
  xAxis: any;
  yAxis: any;
  // margin: {[key: string]: number};
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  gap: number;
  width: number;
  height: number;
  title: string;
  xAxisScaleDefault: any; // d3 default scale function
  yAxisScaleDefault: any; // d3 default scale function
  xAxisScale: any; // d3 scale function
  yAxisScale: any; // d3 scale function
  colorMap: any;
  nameChart: string;  // unique chart name
  label: {
    height: number;
    width: number;
  };
};

export function initD3ChartAttributes(options?: Partial<D3ChartAttributes>): D3ChartAttributes {
  const defaults = {
    svg: null,
    xAxis: null,
    yAxis: null,
    margin: {
      top: 40,
      bottom: 40,
      left: 40,
      right: 40
    },
    gap: 5,
    width: 0,
    height: 0,
    colorMap: [],
    title: '',
    xAxisScale: null,
    yAxisScale: null,
    xAxisScaleDefault: null,
    yAxisScaleDefault: null,
    nameChart: '',
    label: {
      height: 9,
      width: 50
    }
  };
  defaults.width = 550 - defaults.margin.left - defaults.margin.right; // default
  defaults.height = 320 - defaults.margin.top - defaults.margin.bottom; // default

  return {
    ...defaults,
    ...options,
  };
}

export function updateD3ChartSize(attributes: D3ChartAttributes,
                                  width: number,
                                  height: number): D3ChartAttributes {
  attributes.width = width - attributes.margin.left - attributes.margin.right; // update
  attributes.height = height - attributes.margin.top - attributes.margin.bottom; // update

  return attributes;
}

export function createForeignObjDIV(svg, xpos, ypos) {
  const fObj = svg.append('foreignObject')
    .attr('x', xpos)
    .attr('y', ypos)
    .attr('width', '100%')
    .attr('height', '100%');

  const div = fObj.append('xhtml:div')
    .append('div');
  return div;
}

export function createForeignObj(svg, xpos, ypos, width = '100%', height = '100%') {
  const fObj = svg.append('foreignObject')
    .attr('x', xpos)
    .attr('y', ypos)
    .attr('width', width)
    .attr('height', height);
  return fObj;
}

export function createCheckbox(div, text, checked=true) {
  const field__checkbox__div=div
    // .append("div")
    .attr("class","checkbox");

  const field__checkbox__div__label=field__checkbox__div
    .append("label")
    .attr("class","field__label");

  const field__checkbox__div__label__input=field__checkbox__div__label
    .append("input")
    .attr("type","checkbox")
    // .attr("checked", 'false')
    .attr("for",""+0)
    .attr("field_value",'xxx')  // not used yet
    .attr("value",'xxx');  // not used yet

  field__checkbox__div__label__input
    .property('checked', checked);

  field__checkbox__div__label
    .append("span")
    .html(text);

  return field__checkbox__div__label__input;
}

export function createInput(div, text, type='button', style='btn-secondary') {
  const btn = div.append('input')
    .attr('type', type) // button, text, ... (https://www.w3schools.com/html/html_form_input_types.asp)
    .attr('value', text)
    .attr('class', 'btn ' + style +' btn-sm');
  return btn;
}

export function createButton(div, text, style='btn-secondary') {
  const btn = div.append("button")
    .html(text)
    .attr('class', 'btn ' + style +' btn-sm')
    .style('color', 'gray');
  return btn;
}

export function addEmptySpace(div) {
  const btn = div.append('span')
    .html('&nbsp;');
  return btn;
}

export function addHTMLText(div, text) {
  const btn = div.append('span')
    .html(text);
  return btn;
}

export function btnPressed(btn, textColor='white', bgColor='gray'){
  btn.style('color', textColor);
  btn.style('background-color', bgColor);
  return true;
}

export function btnUnPressed(btn, textColor='gray', bgColor='white'){
  btn.style('color', textColor);
  btn.style('background-color', bgColor);
  return false;
}

// https://fontawesome.com/v4/icons/
