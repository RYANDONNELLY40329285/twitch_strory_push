import SettingsPanel from "../../src/components/SettingsPanel";
import { useState } from "react";

describe("SettingsPanel", () => {
  it("renders appearance section", () => {
    cy.mount(
      <SettingsPanel
        theme="default"
        onThemeChange={() => {}}
        customColor="#7c1027"
        onCustomColorChange={() => {}}
      />
    );

    cy.contains("Appearance").should("be.visible");
    cy.contains("Choose how your account modal looks").should("be.visible");
  });

  it("changes theme when preset button is clicked", () => {
    const onThemeChange = cy.stub().as("themeChange");

    cy.mount(
      <SettingsPanel
        theme="default"
        onThemeChange={onThemeChange}
        customColor="#7c1027"
        onCustomColorChange={() => {}}
      />
    );

    cy.contains("Green").click();
    cy.get("@themeChange").should("have.been.calledWith", "green");
  });





});
