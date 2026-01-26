import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const fields = [
  'requests_per_second_mean',
  'request_latency_mean',
  'time_per_output_token_mean',
  'inter_token_latency_mean',
  'time_to_first_token_mean',
  'tokens_per_second_mean',
  'output_tokens_per_second_mean',
  'prompt_tokens_per_second_mean'
];

const Summary: React.FC = () => {
  const { detailData } = useDetailContext();
  return <div></div>;
};

export default Summary;
