import { createSignal, Show } from "solid-js";
import { useAtom } from "solid-jotai";
import { encryptionKeyState } from "../states/session.ts";
import { activeAccount } from "../states/account.ts";
import { resetKeyData } from "./e2ee/api.ts";
import { deleteMLSDatabase } from "./e2ee/storage.ts";
import { getDomain } from "../utils/config.ts";
import { hashEncryptionPassword } from "../utils/crypto.ts";

interface EncryptionKeyFormProps {
  onComplete: (skipped: boolean) => void;
}

export function EncryptionKeyForm(props: EncryptionKeyFormProps) {
  const [key, setKey] = createSignal("");
  const [error, setError] = createSignal("");
  const [, setEncryptionKey] = useAtom(encryptionKeyState);
  const [account] = useAtom(activeAccount);
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    if (!key()) {
      setError("暗号化キーを入力してください");
      return;
    }
    setIsLoading(true);
    const hashed = await hashEncryptionPassword(key());
    setEncryptionKey(hashed);
    localStorage.setItem("encryptionKey", hashed);
    props.onComplete(false);
    setIsLoading(false);
  };

  const handleReset = async () => {
    const acc = account();
    if (!acc) return;
    if (!confirm("鍵をリセットします。よろしいですか？")) return;
    setIsLoading(true);
    await resetKeyData(`${acc.userName}@${getDomain()}`);
    await deleteMLSDatabase(acc.id);
    localStorage.removeItem("encryptionKey");
    setEncryptionKey(null);
    setIsLoading(false);
  };

  const handleSkip = () => {
    props.onComplete(true);
  };

  return (
    <div
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#212121] p-8 rounded-lg shadow-xl w-full max-w-md z-50 text-gray-100"
      style="box-shadow: 0 8px 32px rgba(0,0,0,0.35);"
    >
      <div class="mb-8 text-center">
        <h2 class="text-2xl font-semibold mb-2 text-white">
          暗号化キー入力
        </h2>
        <p class="text-gray-400">チャットの鍵復号に使用します</p>
      </div>
      <form onSubmit={handleSubmit} class="space-y-6">
        <div>
          <label
            for="encryptionKey"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            暗号化キー
          </label>
          <input
            type="password"
            id="encryptionKey"
            value={key()}
            onInput={(e) => setKey(e.currentTarget.value)}
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-colors"
            disabled={isLoading()}
            placeholder="暗号化キーを入力"
            required
          />
        </div>
        <Show when={error()}>
          <p class="text-red-400 text-sm font-medium bg-red-900/30 p-3 rounded-md">
            {error()}
          </p>
        </Show>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading()}
        >
          {isLoading() ? "設定中..." : "設定"}
        </button>
        <button
          type="button"
          class="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading()}
          onClick={handleReset}
        >
          鍵をリセット
        </button>
        <button
          type="button"
          onClick={handleSkip}
          class="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
        >
          後で設定する
        </button>
      </form>
    </div>
  );
}
