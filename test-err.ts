import { FunctionsHttpError } from "@supabase/supabase-js"
console.log(Object.keys(new FunctionsHttpError({ status: 500 })))
