type VllmResponse = {
  results: {
    document: string;
    index: number;
    relevance_score: number;
  }[];
};

type SGLangResponse = {
  document: string;
  index: number;
  score: number;
  meta_info: Record<string, any>;
}[];

const useRerankerResponse = () => {
  const handleSGlangResponse = (response: SGLangResponse) => {
    const promptTokens = response.reduce((acc, curr) => {
      return acc + (curr.meta_info?.prompt_tokens || 0);
    }, 0);
    const results = response.map((item) => ({
      document: item.document,
      index: item.index,
      relevance_score: item.score
    }));
    return {
      results,
      usage: {
        prompt_tokens: promptTokens,
        total_tokens: promptTokens
      }
    };
  };

  const handleVllmResponse = (response: VllmResponse) => {};

  return { handleSGlangResponse, handleVllmResponse };
};

export default useRerankerResponse;
