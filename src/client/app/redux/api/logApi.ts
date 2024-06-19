import { LogData } from 'types/redux/logs';
import { baseApi } from './baseApi';

export const logsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		logInfo: builder.mutation<void, LogData>({
			query: log => ({
				url: '/logs/info',
				method: 'POST',
				body: log
			})
		}),
		logWarn: builder.mutation<void, LogData>({
			query: log => ({
				url: '/logs/warn',
				method: 'POST',
				body: log
			})
		}),
		logError: builder.mutation<void, LogData>({
			query: log => ({
				url: '/logs/error',
				method: 'POST',
				body: log
			})
		}),
		logToServer: builder.mutation<void, LogData & { level: 'info' | 'warn' | 'error'; }>({
			queryFn: async ({ level, message, error, skipMail }, api, _, baseQuery) => {
				const log: LogData = { message };

				if (error) { log.error = error; }

				if (skipMail) { log.skipMail = skipMail; }

				let endpoint;

				switch (level) {
					case 'info':
						endpoint = '/logs/info';
						break;
					case 'warn':
						endpoint = '/logs/warn';
						break;
					case 'error':
						endpoint = '/logs/error';
						break;
					default:
						throw new Error(`Invalid log level: ${level}`);
				}

				const { data, error: err } = await baseQuery({
					url: endpoint,
					method: 'POST',
					body: { ...log }
				});
				return err ? { error: err } : { data: data as void };
			}
		})
	})
});