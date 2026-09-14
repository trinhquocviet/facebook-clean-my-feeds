export const pathInfo = {
  OTHER_INFO_BOX_CORONAVIRUS: {
    pathMatch: '/coronavirus_info/',
    toString() {
      return this.pathMatch;
    },
  },
  OTHER_INFO_BOX_CLIMATE_SCIENCE: {
    pathMatch: '/climatescienceinfo/',
    toString() {
      return this.pathMatch;
    },
  },
  OTHER_INFO_BOX_SUBSCRIBE: {
    pathMatch: '/support/',
    toString() {
      return this.pathMatch;
    },
  },
};

export default pathInfo;
