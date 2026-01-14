/* ------------------------------------------------------------
   📌 ErrorBoundary.jsx — Global React Hata Yakalama (FINAL)
------------------------------------------------------------- */

import React from "react";
import { logError } from "../lib/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    logError("React Component Error", error);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, color: "darkred", fontSize: 22 }}>
          Uygulamada beklenmeyen bir hata oluştu.
        </div>
      );
    }
    return this.props.children;
  }
}
