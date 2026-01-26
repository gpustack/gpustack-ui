import _ from 'lodash';
import React, { useEffect } from 'react';
import { useDetailContext } from '../../config/detail-context';
import useQueryMtrics from '../../services/use-query-metrics';

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
  const { detailData, id } = useDetailContext();
  const {
    detailData: metricsData,
    fetchData,
    cancelRequest
  } = useQueryMtrics();

  useEffect(() => {
    if (id) {
      fetchData({
        id: id,
        data: {
          ..._.pick(detailData, fields)
        }
      });
    } else {
      cancelRequest();
    }
  }, [id]);
  return <div></div>;
};

export default Summary;
