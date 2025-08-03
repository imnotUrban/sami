package env

import (
	"fmt"
	"os"
	"reflect"
	"strconv"
	"time"
)

func ParseEnv(target interface{}) error {
	targetValue := reflect.ValueOf(target)

	if err := validateInput(targetValue); err != nil {
		return err
	}

	structValue := targetValue.Elem()
	structType := structValue.Type()

	for i := 0; i < structValue.NumField(); i++ {
		field := structValue.Field(i)
		fieldType := structType.Field(i)

		if !field.CanSet() {
			continue
		}

		envTag := fieldType.Tag.Get("env")
		if envTag == "" {
			continue
		}

		value, exists := getValueFromEnv(envTag, fieldType.Tag.Get("default"))
		if !exists {
			continue
		}

		if err := setFieldValue(field, fieldType, envTag, value); err != nil {
			return err
		}
	}

	return nil
}

func validateInput(value reflect.Value) error {
	if value.Kind() != reflect.Ptr {
		return fmt.Errorf("config must be a pointer to a struct")
	}

	if value.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("config must be a struct")
	}

	return nil
}

func getValueFromEnv(envName, defaultValue string) (string, bool) {
	value := os.Getenv(envName)

	if value == "" {
		if defaultValue == "" {
			return "", false
		}
		return defaultValue, true
	}

	return value, true
}

func setFieldValue(field reflect.Value, fieldType reflect.StructField, envName, value string) error {
	if fieldType.Type.String() == "time.Duration" {
		return setDurationValue(field, envName, value)
	}

	switch fieldType.Type.Kind() {
	case reflect.String:
		field.SetString(value)

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return setIntValue(field, envName, value)

	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return setUintValue(field, envName, value)

	case reflect.Bool:
		return setBoolValue(field, envName, value)

	case reflect.Float32, reflect.Float64:
		return setFloatValue(field, envName, value)

	default:
		return fmt.Errorf("unsupported type for field %s: %v", fieldType.Name, fieldType.Type)
	}

	return nil
}

func setDurationValue(field reflect.Value, envName, value string) error {
	duration, err := time.ParseDuration(value)
	if err != nil {
		return fmt.Errorf("invalid duration value for %s: %v", envName, err)
	}
	field.Set(reflect.ValueOf(duration))
	return nil
}

func setIntValue(field reflect.Value, envName, value string) error {
	intValue, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return fmt.Errorf("error parsing %s as int: %v", envName, err)
	}
	field.SetInt(intValue)
	return nil
}

func setUintValue(field reflect.Value, envName, value string) error {
	uintValue, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return fmt.Errorf("error parsing %s as uint: %v", envName, err)
	}
	field.SetUint(uintValue)
	return nil
}

func setBoolValue(field reflect.Value, envName, value string) error {
	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return fmt.Errorf("error parsing %s as bool: %v", envName, err)
	}
	field.SetBool(boolValue)
	return nil
}

func setFloatValue(field reflect.Value, envName, value string) error {
	floatValue, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return fmt.Errorf("error parsing %s as float: %v", envName, err)
	}
	field.SetFloat(floatValue)
	return nil
}
