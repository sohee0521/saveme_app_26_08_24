import { Helmet } from "react-helmet-async";

export default function PageTitle({ title }) {
  return (
    <Helmet>
      <title>{`${title} | SAVEME`}</title>
    </Helmet>
  );
}
