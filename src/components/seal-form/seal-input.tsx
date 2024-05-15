import { Input } from 'antd';
import type { InputProps } from 'antd';
import Wrapper from './components/wrapper';
import  { SealFormItemProps } from './types';

const TextArea: React.FC<InputProps & SealFormItemProps> = (props) => {
  return (
    <Wrapper label="input">
      <Input.TextArea placeholder='send your message' autoSize={{minRows: 1,maxRows: 6}} size="large" variant='borderless'></Input.TextArea>
    </Wrapper>
  );
}

const SealInput: React.FC<InputProps & SealFormItemProps> = (props) => {
  const {label, ...rest} = props;
  return (
    <Wrapper label="input">
      <Input {...rest} placeholder='send your message'></Input>
    </Wrapper>
  );
}


export default {TextArea,Input: SealInput};