import {
  AnyAction,
  createSlice,
  Middleware,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Color } from '@material-ui/lab';
import { stringHash } from 'utils/string-utils';
import type { AppDispatch, RootState } from './store';

// to test notification reaction to various error codes, http://httpstat.us/404 can be used where 404 is the status to test.
type NotificationConstructor = {
  message: string;
  type: Color;
};

export class Notification {
  readonly message: string;
  readonly type: Color;
  readonly key: string; // each notification needs a unique ID. We generate a hash from the notification message

  constructor({ message, type }: NotificationConstructor) {
    this.type = type;
    this.message = message;
    this.key = stringHash(message);
  }
}

type NotificationState = {
  notifications: Array<Notification>;
};

const initialState: NotificationState = {
  notifications: [],
};

export const notificationStateSlice = createSlice({
  name: 'notificationState',
  initialState,
  reducers: {
    addNotification: (
      state,
      { payload }: PayloadAction<NotificationConstructor>,
    ) => {
      const { notifications, ...rest } = state;
      const notification = new Notification(payload);

      /**
       * If there is a notification with the same key (hash), it means that there
       * is an existing notification with the same message. In this case
       * we do not update the state and return the existing.
       */
      if (notifications.find(n => n.key === notification.key)) {
        return state;
      }

      return {
        ...rest,
        notifications: notifications.concat(notification),
      };
    },
    removeNotification: (
      { notifications, ...rest },
      { payload }: PayloadAction<Notification['key']>,
    ) => ({
      ...rest,
      notifications: notifications.filter(
        notification => notification.key !== payload,
      ),
    }),
  },
});

// Getters
export const notificationsSelector = (
  state: RootState,
): NotificationState['notifications'] => state.notificationState.notifications;

// Setters
export const {
  addNotification,
  removeNotification,
} = notificationStateSlice.actions;

// middleware to add error as notifications to this slice
// Typing could improve?
export const errorToNotificationMiddleware: Middleware<{}, RootState> = () => (
  dispatch: AppDispatch,
) => (action: AnyAction) => {
  let dispatchResult;
  try {
    // catch sync errors
    // eslint-disable-next-line fp/no-mutation
    dispatchResult = dispatch(action);
  } catch (err) {
    dispatch(
      addNotification({
        type: 'error',
        message: (err as any).message || err,
      }),
    );
    throw err;
  }

  // typical layout for rejected thunk e.g mapState/loadLayerData/rejected
  const thunkRejectedRegex = /^[A-z]+\/[A-z]+\/rejected$/;

  if (thunkRejectedRegex.test(action.type)) {
    const errorMessage = action.error.message || action.error;

    dispatch(
      addNotification({
        type: 'error',
        message: errorMessage,
      }),
    );
    console.error(`Above error(s) caused by: ${errorMessage}`);
  }

  return dispatchResult;
};

export default notificationStateSlice.reducer;
