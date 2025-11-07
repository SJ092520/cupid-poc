const { expect } = require("chai");

describe("Cupid minimal tests", function () {
  it("registers and resolves ids", async function () {
    const Registry = await ethers.getContractFactory("CupidIDRegistry");
    const registry = await Registry.deploy();
    await registry.deployed();

    await registry.registerID("@alice@cupid", "0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002");

    const ethAddr = await registry.resolve("@alice@cupid", "ethereum");
    expect(ethAddr).to.equal("0x0000000000000000000000000000000000000001");
  });
});