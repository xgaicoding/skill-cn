/**
 * adm-zip 的最小 TypeScript 声明（MVP 够用版）
 * ------------------------------------------------
 * 说明：
 * - 当前项目在 `lib/github/zip.ts` 中仅用到了 AdmZip 的少量 API：
 *   - `new AdmZip(buffer?)`
 *   - `getEntries()`
 *   - `addFile(name, data)`
 *   - `toBuffer()`
 *   - entry: `entryName` / `isDirectory` / `getData()`
 * - npm 包 `adm-zip` 自身未内置类型声明，导致 Next.js build 的 TS 校验失败。
 * - 这里提供“够用且可读”的最小声明，避免引入不必要的依赖或大范围 `any` 污染。
 *
 * 注意：
 * - 如果后续使用了更多 adm-zip API，请在此文件补齐对应声明。
 */
declare module "adm-zip" {
  /**
   * Zip 条目（Entry）最小定义：
   * - 仅覆盖当前代码使用到的字段与方法。
   */
  export type IZipEntry = {
    /**
     * 条目在 zip 内的路径（包含目录前缀），通常以 `/` 分隔。
     * 例：`repo-main/src/index.ts`
     */
    entryName: string;
    /**
     * 是否为目录条目。
     */
    isDirectory: boolean;
    /**
     * 获取条目内容（仅对文件有效）。
     */
    getData: () => Buffer;
  };

  /**
   * AdmZip 主类最小定义。
   */
  export default class AdmZip {
    /**
     * @param buffer 可选：已有 zip 的二进制内容
     */
    constructor(buffer?: Buffer);

    /**
     * 返回 zip 中的所有条目。
     */
    getEntries(): IZipEntry[];

    /**
     * 向 zip 写入一个文件（或目录占位文件）。
     *
     * 备注：
     * - 当前代码中用 `addFile(dir + "/", Buffer.alloc(0))` 的方式写目录条目，
     *   这是 adm-zip 的常见用法之一。
     */
    addFile(entryName: string, content: Buffer): void;

    /**
     * 导出 zip 二进制内容。
     */
    toBuffer(): Buffer;
  }
}

