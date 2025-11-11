import { Checkbox } from 'antd';
import AutoComplete from '../auto-complete';
import SealInput from '../seal-input';
import SealSelect from '../seal-select';
import Slider from '../seal-slider';
import Switch from '../seal-switch';

const components: {
  InputNumber: typeof SealInput.Number;
  Select: typeof SealSelect;
  Slider: React.ComponentType<typeof Slider>;
  TextArea: typeof SealInput.TextArea;
  Input: typeof SealInput.Input;
  Checkbox: typeof Checkbox;
  Switch: typeof Switch;
  AutoComplete: typeof AutoComplete;
} = {
  InputNumber: SealInput.Number,
  Select: SealSelect,
  Slider: Slider as React.ComponentType<typeof Slider>,
  TextArea: SealInput.TextArea,
  Input: SealInput.Input,
  Checkbox: Checkbox,
  Switch: Switch,
  AutoComplete: AutoComplete
};

export default components;
