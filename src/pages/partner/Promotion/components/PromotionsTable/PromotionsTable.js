import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import MaterialTable from 'material-table';
import {
  AddBox,
  ArrowDownward,
  Check,
  ChevronLeft,
  ChevronRight,
  Clear,
  DeleteOutline,
  Edit,
  FilterList,
  FirstPage,
  LastPage,
  Remove,
  SaveAlt,
  Search,
  ViewColumn,
} from '@material-ui/icons';
import { Grid, TextField, Button } from '@material-ui/core';
import callApiUnAuth from '../../../../../utils/apis/apiUnAuth';
import moment from 'moment';
import 'react-notifications/lib/notifications.css';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import validate from 'validate.js';
import PromotionEdit from '../PromotionEdit';
import { fetchPromotion, addPromotion } from '../../actions';
const schema = {
  condition: {
    presence: { allowEmpty: false, message: 'Điều kiện áp dụng không được để trống !' }
  },
  type: {
    presence: { allowEmpty: false, message: 'Chính sách khuyến mãi không được để trống !' }
  },
  StartTime: {
    presence: { allowEmpty: false, message: 'Thời gian bắt đầu không được để trống !' },
    datetime: {
      earliest: moment(Date.now()).format('YYYY-MM-DDTHH:mm'),
      message: "Thời gian bắt đầu phải lớn hơn hiện tại !"
    }
  },
  EndTime: {
    presence: { allowEmpty: false, message: 'Thời gian kết thúc không được để trống !' },
      equality: {
        attribute: "StartTime",
        message: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu !",
        comparator: function(v1, v2) {
          return (v1 > v2)
        }
      },    
  }
};

const Promotion = () => {
  const columns = [
    { title: 'Loại khuyến mãi', field: 'promotiontypename' },
    { title: 'Điều kiện khuyến mãi', field: 'conditionname' },
    { title: 'Thời gian bắt đầu', field: 'starttime', render: rowData => moment(rowData.starttime).utcOffset(rowData.starttime).format('HH:mm:ss DD-MM-YYYY') },
    { title: 'Thời gian kết thúc', field: 'endtime', render: rowData => moment(rowData.endtime).utcOffset(rowData.endtime).format('HH:mm:ss DD-MM-YYYY') },
    { title: 'Trạng thái', field: 'status' },
    {
      title: '', field: 'status', render: rowData => {

        if (rowData.status !== 'Đã kết thúc') {
          return (<Button variant="outlined" color="primary" onClick={() => handleEdit(rowData)}>Sửa</Button>)
        }
      }, filtering: false
    }
  ];

  const [isLoading, setIsLoading] = useState(true);
  const firstUpdate = useRef(true);
  const store = useStore().getState().partnerInfo.token.user.PartnerID;
  const dispatch = useDispatch();
  const { data, msg, type, count } = useSelector(state => ({
    data: state.promotion.lst,
    msg: state.promotion.msg,
    type: state.promotion.type,
    count: state.promotion.count
  }));
console.log(data);
  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    if (type === 'success' && type !== null) {
      NotificationManager.success(type, msg, 3000);
    } else if (type !== 'success' && type !== '') {

      NotificationManager.error(type, msg, 3000);
    }
  }, [msg, type, count]);
  
  useEffect(() => {
    const fetchData = async (userid) => {
      dispatch(fetchPromotion(store));
      const resultPromotionType = await callApiUnAuth(`partner/promotiontype`, 'GET', [])
      const resultPromotionCondition = await callApiUnAuth(`partner/promotioncondition`, 'GET', [])
      setPType(resultPromotionType.data);
      setCondition(resultPromotionCondition.data);
    };
    fetchData(store);
  }, [dispatch, store]);
  const [openEdit, setOpenEdit] = useState(false);
  const closeEdit = () => {
    setOpenEdit(false);
  }
  const [editData, setEditData] = useState({});
  const handleEdit = (rowData) => {    
    setOpenEdit(true);
    setEditData(rowData)
  }

  // const [item, setItem] = useState([]);
  const [pType, setPType] = useState([]);
  const [condition, setCondition] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  validate.extend(validate.validators.datetime, {
    parse: function (value, options) {
      return +moment.utc(value);
    },

    format: function (value, options) {
      var format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm";
      return moment.utc(value).format(format);
    }
  });

  const [formState, setFormState] = useState({
    isValid: false,
    values: {
        partnerId: store,
        type: null,
        condition: null,
        StartTime: moment(Date.now()).format('YYYY-MM-DDTHH:mm'),
        EndTime: moment(new Date().setTime(new Date().getTime() + (60*60*1000))).format('YYYY-MM-DDTHH:mm'),
    },
    touched: {},
    errors: {}
  });

  useEffect(() => {
    const errors = validate(formState.values, schema, { fullMessages: false });
    setFormState(formState => ({
      ...formState,
      isValid: errors ? false : true,
      errors: errors || {}
    }));
  }, [formState.values]);

  // const [data, setData] = useState({
  //   item: [],
  //   type: null,
  //   condition: null,
  //   StartTime: moment(Date.now()).format('YYYY-MM-DDTHH:mm'),
  //   EndTime: moment(Date.now()).format('YYYY-MM-DDTHH:mm'),
  // });


  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setIsLoading(false);
  }, [data]);

  const handleChange = event => {
    event.persist();    
    setFormState(formState => ({
      ...formState,
      values: {
        ...formState.values,
        [event.target.name]:
          event.target.type === 'checkbox'
            ? (event.target.checked ? 1 : 0)
            : event.target.value
      },
      touched: {
        ...formState.touched,
        [event.target.name]: true
      }
    }));
  };

  const handleSubmit = async () => {
    setIsCreating(true);

    dispatch(addPromotion(formState.values))
      // setFormState(formState => ({
      //   ...formState,
      //   values: {
      //     ...formState.values,
      //     partnerId: store
      //   }
      // }))
     
   
    setIsCreating(false);
  }

  // const itemchecked = (rows) => {
  //   // setData(oldData => ({
  //   //   ...oldData,
  //   //   item: rows.map(e => e.ItemID)
  //   // }));
  //   setFormState(formState => ({
  //     ...formState,
  //     values: {
  //       ...formState.values,
  //       item: rows.map(e => e.ItemID)
  //     }
  //   }))
  // }

  const hasError = field =>
    formState.touched[field] && formState.errors[field] ? true : false;
  const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
  };

  return (
    <div>
      <NotificationContainer />
      {isLoading ? (
        <div>Loading ...</div>
      ) : (
          <Grid
            container
            spacing={1}
          >
            <Grid
              item
              md={8}
              xs={8}>
              <MaterialTable
                title="Sản Phẩm"
                columns={columns}
                data={data}
                icons={tableIcons}
                // options={{
                //   selection: true
                // }}
                // onSelectionChange={(rows) => itemchecked(rows)}
              />
            </Grid>
            <Grid
              item
              md={4}
              xs={4}>
              <Grid
                container
                spacing={1}
              >
                <Grid
                  item
                  md={12}
                  xs={12}>
                  <TextField
                    fullWidth
                    label="Điều kiện áp dụng"
                    margin="dense"
                    name="condition"
                    onChange={handleChange}
                    required
                    select
                    error={hasError('condition')}
                    helperText={
                      hasError('condition') ? formState.errors.condition[0] : null
                    }
                    SelectProps={{ native: true }}
                    variant="outlined"
                  >
                    <option></option>
                    {condition.map(option => (
                      <option
                        key={option.conditionid}
                        value={option.conditionid}
                      >
                        {option.conditionname}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid
                  item
                  md={12}
                  xs={12}>
                  <TextField
                    fullWidth
                    label="Chính sách khuyến mãi"
                    margin="dense"
                    name="type"
                    onChange={handleChange}
                    required
                    select
                    error={hasError('type')}
                    helperText={
                      hasError('type') ? formState.errors.type[0] : null
                    }
                    SelectProps={{ native: true }}
                    variant="outlined"
                  >
                    <option></option>
                    {pType.map(option => (
                      <option
                        key={option.promotiontypeid}
                        value={option.promotiontypeid}
                      >
                        {option.promotiontypename}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid
                  item
                  md={12}
                  xs={12}
                >
                  <TextField
                    fullWidth
                    label="Thời gian bắt đầu"
                    margin="dense"
                    name="StartTime"
                    type="datetime-local"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={hasError('StartTime')}
                    helperText={
                      hasError('StartTime') ? formState.errors.StartTime[0] : null
                    }
                    value={formState.values.StartTime}
                    onChange={handleChange}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid
                  item
                  md={12}
                  xs={12}
                >
                  <TextField
                    fullWidth
                    label="Thời gian kết thúc"
                    margin="dense"
                    name="EndTime"
                    type="datetime-local"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={hasError('EndTime')}
                    helperText={
                      hasError('EndTime') ? formState.errors.EndTime[0] : null
                    }
                    value={formState.values.EndTime}
                    onChange={handleChange}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid
                  item
                  md={12}
                  xs={12}
                  container
                  justify="center"
                  alignItems="center"
                >
                  <Button onClick={handleSubmit} variant="contained" color="primary" autoFocus disabled={isCreating || !formState.isValid}>
                    Tạo khuyến mãi
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <PromotionEdit open={openEdit} updateParent={closeEdit} data={editData} />
          </Grid>

        )}
    </div>
  );
};

export default Promotion;
