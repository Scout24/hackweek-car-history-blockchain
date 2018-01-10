import React from 'react';
import PropTypes from 'prop-types';

import TrustedIdentitiesService, {TrustLevelEnum} from "../../TrustedIdentitiesService";

export default class TrustLabel extends React.Component {

  constructor(props) {
    super(props);

    this.trustedIdentitiesService = TrustedIdentitiesService.defaultService;
    debugger;

    this.state = {
      name: 'Unknown',
      trustLevel: TrustLevelEnum.Unknown,
      loading: false
    };
  }

  componentDidMount() {
    this.setState({loading: true});
    this.trustedIdentitiesService.getVerificationStatus(this.props.idAddress)
      .then((data) => {
        console.log(data);
        this.setState({name: data.name || 'Unknown', trustLevel: data.trustLevel});
      })
      .catch((e) => {
        console.error(e);
        this.setState({name: 'Unknown', trustLevel: TrustLevelEnum.Unknown});
      })
      .then(() => {
        this.setState({loading: false});
      });
  }

  render() {

    const trustLevel = (() => {
      if (this.state.loading) {
        return "...";
      }

      const trustLevel = parseInt(this.state.trustLevel);
      if (trustLevel === TrustLevelEnum.Verified) {
        return <span style={{color:"green"}}>✅&nbsp;Verified</span>
      } else if (trustLevel === TrustLevelEnum.Fraud) {
        return <span style={{color:"red"}}>❌️&nbsp;Fraud</span>
      } else if (trustLevel === TrustLevelEnum.Admin) {
        return <span style={{color:"green"}}>✅&nbsp;Admin</span>
      } else  {
        return <span style={{color:"orange"}}>⚠️&nbsp;Unverified</span>
      }
    })();

    return (
      <span>{this.state.name} {trustLevel} ({this.props.idAddress})</span>
    );
  }
}

TrustLabel.propTypes = {
  idAddress: PropTypes.string.isRequired
};