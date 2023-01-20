import { SolidityInterfaces } from '../../../typechain';

export const getSolidityInterfaceId = async (
  solidityInterfaces: SolidityInterfaces,
  interfaceName: string,
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await solidityInterfaces.list()).find(x => x.name === interfaceName)!.id;
};
