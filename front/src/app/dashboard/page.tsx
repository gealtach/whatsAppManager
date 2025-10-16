'use client';

import { ProtectedPage } from "../components/ProtectedPage";
import { fetchClient } from "../lib/fetchClient";

const Page = () => {
  const shiBtn = async () => {
    const response = fetchClient.get('/account');
    console.log(response);
  }
  return (
    <ProtectedPage redirectPath="/">
      <div>
        <button
          onClick={shiBtn}
        >asdasdas</button>
      </div>
    </ProtectedPage>
  );
};

export default Page;