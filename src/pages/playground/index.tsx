import { useState,useEffect} from 'react';
import { Button, Select,Space,Input,Popover } from 'antd';
import { ControlOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import SealInput from '@/components/seal-form/seal-input';
import MessageInput from './components/messageInput';
import ChatContent from './components/chatContent';

const dataList = [
  {value: 'llama3:latest', label: 'llama3:latest'},
  {value: 'wangfuyun/AnimateLCM', label: 'wangfuyun/AnimateLCM'},
  {value: 'Revanthraja/Text_to_Vision', label: 'Revanthraja/Text_to_Vision'},
]
const Playground: React.FC = () => {
  const [ModelList, setModelList] = useState(dataList)
  const [messageList, setMessageList] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState('llama3:latest')

  const handleSelectChange = (value: string) => {
    setSelectedModel(value)
  }

  const getMessageList = () => {
    // fetch message list from server
    setMessageList(['1'])
  }

  useEffect(() => {
    getMessageList()
  }, [selectedModel])

  return (
    <PageContainer
     
      title={false}
      extra={[
        <Space size={20}>
          <Select showSearch options={ModelList} style={{width: 300}} value={selectedModel} onChange={handleSelectChange} variant='filled'></Select>
          <Popover content="ssd" title="Title" trigger="click">
            <Button  type="primary" shape="circle"  icon={<ControlOutlined />}>
            </Button>
          </Popover>
          
        </Space>
      ]}
      footer={[
        <MessageInput/>
      ]}
        >
         
          <div  style={{display: 'flex', justifyContent: 'center'}}>
            <ChatContent messageList={messageList}></ChatContent>
          </div>
            <SealInput.Input label="test label"></SealInput.Input>
    </PageContainer>
  );
};

export default Playground;